const yaml = require('js-yaml');
const fs = require('fs');
const indentString = require('indent-string');
const mkdirp = require('mkdirp');
const _ = require('underscore');

function camelCaseToTitleCase(in_camelCaseString) {
  const result = in_camelCaseString // "ToGetYourGEDInTimeASongAboutThe26ABCsIsOfTheEssenceButAPersonalIDCardForUser456ContainingABC26TimesIsNotAsEasyAs123"
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

function multiline_function(code, indent) {
  const lines = code.split('\n');
  if (lines.length > 1) { return `${lines[0]}\n${indentString(lines.slice(1, -1).join('\n'), indent)}`; }
  return lines[0];
  return code;
}

function write_file(directory, name, content) {
  const stream = fs.createWriteStream(`${directory + name}.js`);
  stream.once('open', (fd) => {
    stream.write(content);
    stream.end();
  });
}

function write_apps(doc) {
  const app_files = [];

  for (const app of doc) {
    const app_dir = `./${app.name}/`;

    // Make redux actions
    const actions = [];
    const actions_actions = [];
    const action_creators = [];
    const action_creator_names = [];

    for (const action of app.actions || []) {
      action_creator_names.push(action.name);

      // Make redux action definition name
      const action_name = makeActionName(action.name);
      const action_args = action.args ? action.args.split(/,/g) : [];

      // Make redux action creator arguments
      let creator_args_str = '';
      if (action_args.length > 0) {
        if (action_args.length > 1) {
          const joined_args = action_args.join(', ');
          creator_args_str = `(${joined_args}) => `;
        } else {
          creator_args_str = `${action_args[0]} => `;
        }
      }

      if (!action.thunk) {
        actions.push(action_name);
        // Make redux action definitions
        actions_actions.push(`export ${action_name} = '${action_name}';`);

        let payload = '';
        if (action_args.length > 0) {
          // Make redux action creator payloads
          payload = ',\npayload: ';
          if (action_args.length > 1) {
            const joined_args = action_args.join(', \n');
            const indented_payload = indentString(`\n${joined_args}`, 2);
            payload += `{${indented_payload}\n}`;
          } else {
            payload += action_args[0];
          }
        }
        const indented_object = indentString(`type: ${action_name}${payload}`, 2);
        const indented_function = indentString(`return {\n${indented_object}\n};`, 2);
        action_creators.push(
          `export const ${action_name} => ${creator_args_str} {\n${indented_function}\n};`,
        );
      } else {
        // Make redux thunks
        const thunk_args = action.thunk.args.split(/,/).join(', ');
        const thunk_args_str = thunk_args ? `, {${thunk_args}}` : '';
        const indented_inner_function = indentString(action.thunk.thunk, 2);
        const indented_outer_function = indentString(
          `return (dispatch, getState${thunk_args_str}) => {\n${indented_inner_function}};`,
          2,
        );

        action_creators.push(
          `export const ${action.name} => ${creator_args_str} {\n${indented_outer_function}\n};`,
        );
      }
    }

    // Make redux reducers
    const reducers = [];
    const reducers_names = [];
    const reducers_actions = [];
    for (const reducer of app.reducers || []) {
      reducers_names.push(reducer.name);
      const cases = [];
      // Make each switch case
      for (const reducer_action of reducer.actions) {
        const action_name = makeActionName(reducer_action.name);
        reducers_actions.push(action_name);
        const indented_case = indentString(reducer_action.reducer, 2);
        cases.push(`case ${action_name}:\n${indented_case}`);
      }
      cases.push('default:\n', indentString('return state', 2));
      const joined_cases = cases.join('');
      const indented_switch = indentString(`switch (action.type) {\n${joined_cases}\n}`, 2);
      reducers.push(
        `function ${reducer.name} (state = ${reducer.default}, action) {\n${indented_switch}\n};`,
      );
    }

    // Make redux-orm models
    const model_dir = `${app_dir}models/`;
    if (app.models) {
      const models = [];
      for (const model of app.models || []) {
        models.push(model.name);

        const model_reducers_actions = [];
        const cases = [];

        // Make redux-orm model reducer
        for (const reducer_action of model.actions) {
          const reducer_action_name = makeActionName(reducer_action.name);
          model_reducers_actions.push(reducer_action_name);
          const indented_case = indentString(reducer_action.reducer, 2);
          cases.push(`case ${reducer_action_name}:\n${indented_case}`);
        }

        const joined_cases = cases.join('');
        const indented_switch = indentString(`switch (action.type) {\n${joined_cases}\n}`, 2);
        const model_reducer = indentString(
          `static reducer(state, action, ${model.name}, session) {\n${indented_switch}\n};`,
          2,
        );
        // Make redux-orm model field definitions
        let fields = '';
        Object.keys(model.fields).forEach((key) => {
          fields += `${key}: ${model.fields[key]},\n`;
        });
        fields = indentString(fields, 2);

        const indented_model_actions = indentString(model_reducers_actions.join(',\n'), 2);
        const model_actions_import = `import {\n${indented_model_actions}\nfrom '../actions';\n\n`;

        const model_prepend = model.prepend || '';

        app_files.push({
          directory: model_dir,
          base_name: model.name,
          content:
            `import { Model, many, fk, Schema } from \'redux-orm\'${model_prepend}` +
            `export class ${model.name} extends Model {\n${model_reducer}\n}\n\n` +
            `${model.name}.modelName = '${model.name}';\n\n` +
            `${model.name}.fields = {\n${fields}};\n\n` +
            `export default ${model.name};\n`,
        });
      }
      const model_imports = models.map(m => `import * as ${m} from './${m}';`).join('\n');
      const models_list = models.join(', ');

      app_files.push({
        directory: model_dir,
        base_name: 'index',
        content:
          `${model_imports}\n\n` +
          'export const schema = new Schema();\n' +
          `schema.register(${models_list});\n\n` +
          'export default schema;\n',
      });
    }

    app_files.push({
      directory: app_dir,
      base_name: 'actions',
      content: actions_actions.join('\n\n'),
    });

    let prepend = app.actioncreators_prepend || '';
    prepend = prepend ? `${prepend}\n\n` : '';
    const joined_actions = indentString(actions.join(',\n'), 2);
    const joined_action_creators = action_creators.join('\n\n');

    app_files.push({
      directory: app_dir,
      base_name: 'creators',
      content: `import {${joined_actions}\n\n} from './actions';\n\n${prepend}${joined_action_creators}\n`,
    });

    let reducers_prepend = app.reducers_prepend;
    reducers_prepend = reducers_prepend ? `${reducers_prepend}\n\n` : '';
    const joined_reducer_actions = indentString(reducers_actions.join(',\n'), 2);
    const joined_reducers = reducers.join('\n\n');
    const joined_reducers_names = reducers_names.join(', ');

    app_files.push({
      directory: app_dir,
      base_name: 'reducers',
      content:
        "import { combineReducers } from 'redux';\n" +
        `import {\n${joined_reducer_actions}\n} from './actions';\n\n${reducers_prepend}${joined_reducers}` +
        `\n\nexport default reducer = combineReducers(${joined_reducers_names});\n`,
    });

    const selectors_names = [];
    let selectors_code = '';

    for (const selector of app.selectors || []) {
      selectors_names.push(selector.name);

      if (!(selectors_code == '')) {
        selectors_code += '\n\n';
      }

      selectors_code += `export const ${selector.name} = `;

      if (!selector.combine) {
        selectors_code += multiline_function(selector.function, 2);
      } else {
        let indent = 2;
        let start = 'createSelector(\n';
        let end = ')';

        if (selector.maker) {
          indent = 4;
          start = '() => {\n return createSelector(\n';
          end = '  )\n}';
        }

        selectors_code +=
          start +
          indentString(
            `[ ${selector.combine.split(',').join(', ')} ],\n${selector.function}`,
            indent,
          ) +
          end;
      }
    }

    let selectors_prepend = app.selectors_prepend || '';
    selectors_prepend = selectors_prepend ? `${selectors_prepend}\n\n` : '';
    app_files.push({
      directory: app_dir,
      base_name: 'selectors',
      content: `import { createSelector } from 'reselect'\n\n${selectors_prepend}${selectors_code}`,
    });

    // Make react components
    const components_dir = `${app_dir}components/`;
    if (app.components) {
      const components = [];
      for (const component of app.components || []) {
        components.push(component.name);

        const directory = component.is_async
          ? `${components_dir}${component.name}/`
          : components_dir;
        const parent_directory = component.is_async ? '../../' : '../';

        const import_actions = _.intersection(
          (component.actions || '').split(','),
          action_creator_names,
        ).join(',\n  ');
        const import_actions_str = import_actions
          ? `import {\n  ${import_actions}\n} from '${parent_directory}creators';\n\n`
          : '';

        const import_selectors = _.intersection(
          (component.selectors || '').split(','),
          selectors_names,
        ).join(',\n  ');
        const import_selectors_str = import_selectors
          ? `import {\n  ${import_selectors}\n} from '${parent_directory}selectors';\n\n`
          : '';

        const prepend = component.component_prepend || '';

        app_files.push({
          directory,
          base_name: component.name,
          content: `${import_actions_str}${prepend}${component.component_content}`,
        });

        if (component.is_async) {
          app_files.push({
            directory,
            base_name: 'index',
            content:
              "import { asyncComponent } from 'react-async-component';\n\n" +
              'export default asyncComponent({\n' +
              `resolve: () => System.import('./${component.name}'),\n  ` +
              "ssrMode: 'boundary',\n  " +
              `name: '${component.name}'\n});`,
          });
        }
      }
    }
    app_files.map((app_file) => {
      mkdirp(app_file.directory, () => {
        write_file(app_file.directory, app_file.base_name, app_file.content);
      });
    });
  }
}

// Get document, or throw exception on error

try {
  const doc = yaml.safeLoad(fs.readFileSync('./apps.yml', 'utf8'));
  write_apps(doc);
} catch (e) {
  console.log(e);
}
