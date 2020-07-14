"use strict";
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
exports.__esModule = true;
var shelljs_1 = require("shelljs");
var commander_1 = require("commander");
var chalk = require("chalk");
var fs = require("fs");
var ProgressBar = require('progress');
var log = console.log;
commander_1.program.version('1.0.0');
commander_1.program
    .option('-f, --file <path>', 'dependencies.json path');
commander_1.program.parse(process.argv);
if (!commander_1.program.file)
    process.exit(1);
var projects = JSON.parse(fs.readFileSync(commander_1.program.file).toString());
var bar = new ProgressBar('parsing dependencies [:bar] :percent', { total: Object.keys(projects).length, width: 100 });
var allDependencies = {};
for (var _i = 0, _a = Object.entries(projects); _i < _a.length; _i++) {
    var _b = _a[_i], project = _b[0], path = _b[1];
    shelljs_1.cd(path);
    var a = JSON.parse(shelljs_1.exec('npm list --json', { silent: true }));
    var dependencies = a.dependencies;
    for (var _c = 0, _d = Object.entries(dependencies); _c < _d.length; _c++) {
        var _e = _d[_c], key = _e[0], val = _e[1];
        var _f = val, version_1 = _f.version, required = _f.required;
        var finalVersion = 0;
        var computedVersion = version_1 || (required === null || required === void 0 ? void 0 : required.version);
        if (computedVersion) {
            var _g = computedVersion.replace(/^(\^)?(>=)?(\*)?/, '').split('.'), major = _g[0], minor = _g[1], patch = _g[2];
            finalVersion = Number("" + major + minor + "." + patch);
        }
        allDependencies[key] = allDependencies[key] ? __spreadArrays(allDependencies[key], [
            [project, finalVersion, computedVersion],
        ]) : [[project, finalVersion, computedVersion]];
    }
    bar.tick();
}
var diff = {};
var _loop_1 = function (dependency, values) {
    var _a = values[0], _ = _a[0], firstVersion = _a[1];
    var isSame = values.every(function (_a) {
        var _ = _a[0], version = _a[1];
        return firstVersion === version;
    });
    if (!isSame) {
        diff[dependency] = allDependencies[dependency];
    }
};
for (var _h = 0, _j = Object.entries(allDependencies); _h < _j.length; _h++) {
    var _k = _j[_h], dependency = _k[0], values = _k[1];
    _loop_1(dependency, values);
}
log(chalk.blue('----------------------'));
log(chalk.blue('Dependencies with diff'));
log(chalk.blue('----------------------'));
var mapMessage = function (entity, index, topOfMind) {
    var project = entity[0], version = entity[2];
    var firstVersion = topOfMind[2];
    if (index === 0) {
        log(chalk.green("[LATEST] => [" + project + "] " + version));
    }
    else if (version !== firstVersion) {
        log(chalk.red("[OUTDATED] => [" + project + "] " + version));
    }
    else {
        log(chalk.blue("[UP-TO-DATE] => [" + project + "] " + version));
    }
};
Object.entries(diff).forEach(function (_a) {
    var dependency = _a[0], values = _a[1];
    log(chalk.bold(chalk.blue("")));
    log(chalk.bold(chalk.blue(dependency + ": ")));
    var sorted = Object.entries(values).sort(function (_a, _b) {
        var _c = _a[1], versionA = _c[1];
        var _d = _b[1], versionB = _d[1];
        return Number(versionB) - Number(versionA);
    });
    var _b = sorted[0], topOfMind = _b[1];
    sorted.forEach(function (_a, index) {
        var entity = _a[1];
        return mapMessage(entity, index, topOfMind);
    });
});
