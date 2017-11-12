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
      for (let action of app.actions) {
        let action_name = makeActionName(action.name);
        let action_args = action.args ? action.args.split(/,/g) : [];

        let creator_args_str =
          action_args.length > 0
            ? action_args.length > 1
              ? '(' + action_args.join(', ') + ') => '
              : action_args[0] + ' => '
            : '';

        if (!action.thunk) {
          actions.push(action_name);
          actions_actions.push('export ' + action_name + ' = ' + "'" + action_name + "';");

          let payload =
            action_args.length > 0
              ? ',\npayload: ' +
                (action_args.length > 1
                  ? '{' + indentString('\n' + action_args.join(', \n'), 2) + '\n}'
                  : action_args[0])
              : '';

          action_creators.push(
            'export const ' +
              action.name +
              ' => ' +
              creator_args_str +
              '{\n' +
              indentString(
                'return {\n' + indentString('type: ' + action_name + payload, 2) + '\n};',
                2,
              ) +
              '\n};',
          );
        } else {
          let thunk_args = action.thunk.args.split(/,/);
          let thunk_args_str = '{' + thunk_args.join(', ') + '}';
          action_creators.push(
            'export const ' +
              action.name +
              ' => ' +
              creator_args_str +
              '{\n' +
              indentString(
                'return (dispatch, getState, ' +
                  thunk_args_str +
                  ') => {\n' +
                  indentString(action.thunk.thunk, 2) +
                  '};',
                2,
              ) +
              '\n};',
          );
        }
      }
      let reducers = [];
      let reducers_actions = [];
      for (let reducer of app.reducers) {
        let switches = [];
        for (let reducer_action of reducer.actions) {
          reducers_actions.push(makeActionName(reducer_action.name));
          switches.push(
            'case ' +
              makeActionName(reducer_action.name) +
              ':\n' +
              indentString(reducer_action.reducer, 2),
          );
        }
        switches.push('default:\n', indentString('return state', 2));
        reducers.push(
          'function ' +
            reducer.name +
            '(state = ' +
            reducer.default +
            ', action) {\n' +
            indentString('switch (action.type) {\n' + switches.join('') + '\n}', 2) +
            '\n};',
        );
      }
      let models = [];
      for (let model of app.models) {
        let model_dir = app_dir + 'models/';
        mkdirp(model_dir, function(err) {
          let model_reducers_actions = [];
          let switches = [];
          for (let reducer_action of model.actions) {
            model_reducers_actions.push(makeActionName(reducer_action.name));
            switches.push(
              'case ' +
                makeActionName(reducer_action.name) +
                ':\n' +
                indentString(reducer_action.reducer, 2),
            );
          }
          let model_reducer = indentString(
            'static reducer(state, action, ' +
              model.name +
              ', session) {\n' +
              indentString('switch (action.type) {\n' + switches.join('') + '\n}', 2) +
              '\n};',
            2,
          );
          write_file(
            model_dir,
            model.name,
            'import {\n' +
              indentString(model_reducers_actions.join(',\n'), 2) +
              "\n} from '../actions';\n\n" +
              'export class ' +
              model.name +
              ' extends Model {\n' +
              model_reducer +
              '\n}',
          );
        });
      }

      write_file(app_dir, 'actions', actions_actions.join('\n\n'));
      write_file(
        app_dir,
        'creators',
        'import {\n' +
          indentString(actions.join(',\n'), 2) +
          "\n} from './actions';\n\n" +
          action_creators.join('\n\n') +
          '\n',
      );
      write_file(
        app_dir,
        'reducers',
        'import {\n' +
          indentString(reducers_actions.join(',\n'), 2) +
          "\n} from './actions';\n\n" +
          reducers.join('\n\n'),
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
