var fs = require("fs"); // for file system reading
var path = require("path"); // for working with paths
var chalk = require("chalk"); //color command line output
var parse = require("react-docgen").parse; // the lib that will look at our components and pull the metadata out of their code
var chokidar = require("chokidar"); // allows us to watch files and run a function in a cross platform way

var paths = {
  examples: path.join(__dirname, "../src", "docs", "examples"),
  components: path.join(__dirname, "../src", "components"),
  output: path.join(__dirname, "../config", "componentData.js")
};

const enableWatchMode = process.argv.slice(2) == "--watch";
if (enableWatchMode) {
  // Regenerate component metadata when components or examples change.
  chokidar
    .watch([paths.examples, paths.components])
    .on("change", function(event, path) {
      generate(paths);
    });
} else {
  // Generate component metadata
  generate(paths);
}

function generate(paths) {
  var errors = [];
  var componentData = getDirectories(paths.components).map(function(
    componentName
  ) {
    try {
      return getComponentData(paths, componentName);
    } catch (error) {
      errors.push(
        "An error occurred while attempting to generate metadata for " +
          componentName +
          ". " +
          error
      );
    }
  });
  writeFile(
    paths.output,
    "module.exports = /* eslint-disable */ " +
      JSON.stringify(errors.length ? errors : componentData)
  );
}

function getComponentData(paths, componentName) {
  var content = readFile(
    path.join(paths.components, componentName, componentName + ".js")
  );
  var info = parse(content);
  return {
    name: componentName,
    description: info.description,
    props: info.props,
    code: content,
    examples: getExampleData(paths.examples, componentName)
  };
}

function getExampleData(examplesPath, componentName) {
  var examples = getExampleFiles(examplesPath, componentName);
  return examples.map(function(file) {
    var filePath = path.join(examplesPath, componentName, file);
    var content = readFile(filePath);
    var info = parse(content);
    return {
      // By convention, component name should match the filename.
      // So remove the .js extension to get the component name.
      name: file.slice(0, -3),
      description: info.description,
      code: content
    };
  });
}

function getExampleFiles(examplesPath, componentName) {
  var exampleFiles = [];
  try {
    exampleFiles = getFiles(path.join(examplesPath, componentName));
  } catch (error) {
    console.log(chalk.red(`No examples found for ${componentName}.`));
  }
  return exampleFiles;
}

function getDirectories(filepath) {
  return fs.readdirSync(filepath).filter(function(file) {
    return fs.statSync(path.join(filepath, file)).isDirectory();
  });
}

function getFiles(filepath) {
  return fs.readdirSync(filepath).filter(function(file) {
    return fs.statSync(path.join(filepath, file)).isFile();
  });
}

function writeFile(filepath, content) {
  fs.writeFile(filepath, content, function(err) {
    err
      ? console.log(chalk.red(err))
      : console.log(chalk.green("Component data saved."));
  });
}

function readFile(filePath) {
  return fs.readFileSync(filePath, "utf-8");
}
