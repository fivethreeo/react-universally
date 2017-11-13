const yaml = require('js-yaml');
const fs = require('fs');
const indentString = require('indent-string');
const mkdirp = require('mkdirp');

function camelCaseToTitleCase(in_camelCaseString) {
  var result = in_camelCaseString // "ToGetYourGEDInTimeASongAboutThe26ABCsIsOfTheEssenceButAPersonalIDCardForUser456ContainingABC26TimesIsNotAsEasyAs123"
    .replace(/([a-z])([A-Z][a-z])/g, '$1 $2') // "To Get YourGEDIn TimeASong About The26ABCs IsOf The Essence ButAPersonalIDCard For User456ContainingABC26Times IsNot AsEasy As123"
    .replace(/([A-Z][a-z])([A-Z])/g, '$1 $2') // "To Get YourGEDIn TimeASong About The26ABCs Is Of The Essence ButAPersonalIDCard For User456ContainingABC26Times Is Not As Easy As123"
    .replace(/([a-z])([A-Z]+[a-z])/g, '$1 $2') // "To Get Your GEDIn Time ASong About The26ABCs Is Of The Essence But APersonal IDCard For User456ContainingABC26Times Is Not As Easy As123"
    .replace(/([A-Z]+)([A-Z][a-z][a-z])/g, '$1 $2') // "To Get Your GEDIn Time A Song About The26ABCs Is Of The Essence But A Personal ID Card For User456ContainingABC26Times Is Not As Easy As123"
    .replace(/([a-z]+)([A-Z0-9]+)/g, '$1 $2') // "To Get Your GEDIn Time A Song About The 26ABCs Is Of The Essence But A Personal ID Card For User 456Containing ABC26Times Is Not As Easy As 123"
    // Note: the next regex includes a special case to exclude plurals of acronyms, e.g. "ABCs"
    .replace(/([A-Z]+)([A-Z][a-rt-z][a-z]*)/g, '$1 $2') // "To Get Your GED In Time A Song About The 26ABCs Is Of The Essence But A Personal ID Card For User 456Containing ABC26Times Is Not As Easy As 123"
    .replace(/([0-9])([A-Z][a-z]+)/g, '$1 $2') // "To Get Your GED In Time A Song About The 26ABCs Is Of The Essence But A Personal ID Card For User 456 Containing ABC26 Times Is Not As Easy As 123"
    .replace(/([A-Z]+)([0-9]+)/g, '$1 $2') // "To Get Your GED In Time A Song About The 26ABCs Is Of The Essence But A Personal ID Card For User 456 Containing ABC 26 Times Is Not As Easy As 123"
    .replace(/([0-9]+)([A-Z]+)/g, '$1 $2') // "To Get Your GED In Time A Song About The 26 ABCs Is Of The Essence But A Personal ID Card For User 456 Containing ABC 26 Times Is Not As Easy As 123"
    .trim();

  // capitalize the first letter
  return result.charAt(0).toUpperCase() + result.slice(1);
}

function makeActionName(creatorName) {
  return camelCaseToTitleCase(creatorName).replace(/\s/g, '_').toUpperCase();
}

function ensureExists(path, mask, cb) {
  if (typeof mask == 'function') {
    // allow the `mask` parameter to be optional
    cb = mask;
    mask = 0777;
  }
  fs.mkdir(path, mask, function(err) {
    if (err) {
      if (err.code == 'EEXIST')
        cb(null); // ignore the error if the folder already exists
      else cb(err); // something else went wrong
    } else cb(null); // successfully created folder
  });
}

function write_file(directory, name, content) {
  var stream = fs.createWriteStream(directory + name + '.js');
  stream.once('open', function(fd) {
    stream.write(content);
    stream.end();
  });
}

function write_apps(doc) {
  for (let app of doc) {
    let app_dir = './' + app.name + '/';
    mkdirp(app_dir, function(err) {
      let actions = [];
      let actions_actions = [];
      let action_creators = [];

      for (let action of app.actions || []) {
        let action_name = makeActionName(action.name);
        let action_args = action.args ? action.args.split(/,/g) : [];

        let creator_args_str = '';
        if (action_args.length > 0) {
          if (action_args.length > 1) {
            let joined_args = action_args.join(', ');
            creator_args_str = `(${joined_args}) => `;
          } else {
            creator_args_str = `${action_args[0]} => `;
          }
        }

        if (!action.thunk) {
          actions.push(action_name);
          actions_actions.push(`export ${action_name} = '${action_name}';`);

          let payload = '';
          if (action_args.length > 0) {
            payload = ',\npayload: ';
            if (action_args.length > 1) {
              let joined_args = action_args.join(', \n');
              let indented_payload = indentString(`\n${joined_args}`, 2);
              payload += `{${indented_payload}\n}`;
            } else {
              payload += action_args[0];
            }
          }
          let indented_object = indentString(`type: ${action_name}${payload}`, 2);
          let indented_function = indentString(`return {\n${indented_object}\n};`, 2);
          action_creators.push(
            `export const ${action_name} => ${creator_args_str} {\n${indented_function}\n};`,
          );
        } else {
          let thunk_args = action.thunk.args.split(/,/).join(', ');
          let thunk_args_str = thunk_args ? `, {${thunk_args}}` : '';
          let indented_inner_function = indentString(action.thunk.thunk, 2);
          let indented_outer_function = indentString(
            `return (dispatch, getState${thunk_args_str}) => {\n${indented_inner_function}};`,
            2,
          );

          action_creators.push(
            `export const ${action.name} => ${creator_args_str} {\n${indented_outer_function}\n};`,
          );
        }
      }
      let reducers = [];
      let reducers_names = [];
      let reducers_actions = [];
      for (let reducer of app.reducers || []) {
        reducers_names.push(reducer.name);
        let cases = [];
        for (let reducer_action of reducer.actions) {
          let action_name = makeActionName(reducer_action.name);
          reducers_actions.push(action_name);
          let indented_case = indentString(reducer_action.reducer, 2);
          cases.push(`case ${action_name}:\n${indented_case}`);
        }
        cases.push('default:\n', indentString('return state', 2));
        let joined_cases = cases.join('');
        let indented_switch = indentString(`switch (action.type) {\n${joined_cases}\n}`, 2);
        reducers.push(
          `function ${reducer.name} (state = ${reducer.default}, action) {\n${indented_switch}\n};`,
        );
      }

      let model_dir = app_dir + 'models/';

      mkdirp(model_dir, function(err) {
        let models = [];
        for (let model of app.models || []) {
          models.push(model.name);

          let model_reducers_actions = [];
          let cases = [];
          for (let reducer_action of model.actions) {
            let reducer_action_name = makeActionName(reducer_action.name);
            model_reducers_actions.push(reducer_action_name);
            let indented_case = indentString(reducer_action.reducer, 2);
            cases.push(`case ${reducer_action_name}:\n${indented_case}`);
          }

          let joined_cases = cases.join('');
          let indented_switch = indentString(`switch (action.type) {\n${joined_cases}\n}`, 2);
          let model_reducer = indentString(
            `static reducer(state, action, ${model.name}, session) {\n${indented_switch}\n};`,
            2,
          );

          let fields = '';
          Object.keys(model.fields).forEach(function(key) {
            fields += key + ': ' + model.fields[key] + ',\n';
          });
          fields = indentString(fields, 2);

          let indented_model_actions = indentString(model_reducers_actions.join(',\n'), 2);
          let model_actions_import = `import {\n${indented_model_actions}\nfrom '../actions';\n\n`;
          write_file(
            model_dir,
            model.name,
            `import { Model, many, fk, Schema } from 'redux-orm';` +
              `export class ${model.name} extends Model {\n${model_reducer}\n}\n\n` +
              `${model.name}.modelName = '${model.name}';\n\n` +
              `${model.name}.fields = {\n${fields}};\n\n` +
              `export default ${model.name};\n`,
          );
        }
        let model_imports = models
          .map(function(m) {
            return `import * as ${m} from './${m}';`;
          })
          .join('\n');
        let models_list = models.join(', ');
        write_file(
          model_dir,
          'index',
          `${model_imports}\n\n` +
            `export const schema = new Schema();\n` +
            `schema.register(${models_list});\n\n` +
            `export default schema;\n`,
        );
      });

      write_file(app_dir, 'actions', actions_actions.join('\n\n'));

      let prepend = app.actioncreators_prepend;
      prepend = prepend ? `${prepend}\n\n` : '';
      let joined_actions = indentString(actions.join(',\n'), 2);
      let joined_action_creators = action_creators.join('\n\n');
      write_file(
        app_dir,
        'creators',
        `import {${joined_actions}\n\n} from './actions';\n\n${prepend}${joined_action_creators}\n`,
      );

      let reducers_prepend = app.reducers_prepend;
      reducers_prepend = reducers_prepend ? `${reducers_prepend}\n\n` : '';
      let joined_reducer_actions = indentString(reducers_actions.join(',\n'), 2);
      let joined_reducers = reducers.join('\n\n');
      let joined_reducers_names = reducers_names.join(', ');
      write_file(
        app_dir,
        'reducers',
        `import { combineReducers } from \'redux\';\n` +
          `import {\n${joined_reducer_actions}\n} from './actions';\n\n${reducers_prepend}${joined_reducers}` +
          `\n\nexport default reducer = combineReducers(${joined_reducers_names});\n`,
      );
    });
  }
}

// Get document, or throw exception on error

try {
  var doc = yaml.safeLoad(fs.readFileSync('./apps.yml', 'utf8'));
  write_apps(doc);
} catch (e) {
  console.log(e);
}
