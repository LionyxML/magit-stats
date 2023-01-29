#! /usr/bin/env node
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
import { exec } from "child_process";
import * as prettier from "prettier";
import { addIndex, applySpec, concat, count, descend, filter, map, mergeWith, pathOr, pathEq, pipe, prop, range, sortWith, uniq, zipWith, } from "ramda";
var APP_NAME = "magit-stats";
var CHECK_GIT_DIR_CMD = "git status";
var GIT_LOG_CMD = "git log --pretty=format:'{%n  \"commit\": \"%H\",%n  \"abbreviated_commit\": \"%h\",%n  \"tree\": \"%T\",%n  \"abbreviated_tree\": \"%t\",%n  \"parent\": \"%P\",%n  \"abbreviated_parent\": \"%p\",%n  \"refs\": \"%D\",%n  \"encoding\": \"%e\",%n  \"subject\": \"%s\",%n  \"sanitized_subject_line\": \"%f\",%n  \"commit_notes\": \"%N\",%n  \"verification_flag\": \"%G?\",%n  \"signer\": \"%GS\",%n  \"signer_key\": \"%GK\",%n  \"author\": {%n    \"name\": \"%aN\",%n    \"email\": \"%aE\",%n    \"date\": \"%aD\"%n  },%n  \"commiter\": {%n    \"name\": \"%cN\",%n    \"email\": \"%cE\",%n    \"date\": \"%cD\"%n  }%n},'";
var DAY_HOURS = range(0, 23);
var WEEK_DAYS = range(0, 7);
var logMsg = function (msg) { return console.log("[".concat(APP_NAME, "]"), msg); };
var logError = function (msg) { return console.error("[".concat(APP_NAME, "]"), msg); };
var mapIndexed = addIndex(map);
var generateDateObj = function (dateRFC) {
    var date = new Date(dateRFC);
    return {
        month: date.getMonth(),
        day: date.getDate(),
        year: date.getFullYear(),
        hour: date.getHours(),
        weekDay: date.getDay(),
    };
};
var checkIsInsideGitDir = function () {
    return exec(CHECK_GIT_DIR_CMD, function (error) {
        if (error) {
            logError(error.message);
            process.exit(-1);
        }
    });
};
var getGitLogStats = function () {
    return exec(GIT_LOG_CMD, function (error, stdout, stderr) {
        if (error) {
            logError(error.message);
            process.exit(-1);
        }
        if (stderr) {
            logError(stderr);
            process.exit(-1);
        }
        var commits = pipe(function (stdout) { return prettier.format("[".concat(stdout, "]"), { parser: "json" }); }, JSON.parse, map(function (commit) { return (__assign(__assign({}, commit), { date: generateDateObj(pathOr("", ["author", "date"], commit)) })); }))(stdout);
        var totalCommits = commits.length;
        var authors = pipe(map(prop("author")), map(applySpec({
            name: prop("name"),
            email: prop("email"),
        })), uniq)(commits);
        var commitsByAuthor = pipe(map(function (author) {
            var authorCommits = filter(pathEq(["author", "name"], prop("name", author)), commits).length;
            var authorCommitsShare = (authorCommits / totalCommits) * 100;
            return {
                authorCommits: authorCommits,
                authorCommitsShare: authorCommitsShare,
            };
        }), zipWith(mergeWith(concat), authors), sortWith([descend(prop("authorCommits"))]))(authors);
        var commitsByDayHour = pipe(map(function (hour) {
            return pipe(map(pathEq(["date", "hour"], hour)), count(function (hasCommit) { return hasCommit; }))(commits);
        }), mapIndexed(function (commits, hour) { return ({ hour: hour, commits: commits }); }))(DAY_HOURS);
        var commitsByWeekDay = pipe(map(function (day) {
            return pipe(map(pathEq(["date", "weekDay"], day)), count(function (hasCommit) { return hasCommit; }))(commits);
        }), mapIndexed(function (commits, weekDay) { return ({ weekDay: weekDay, commits: commits }); }))(WEEK_DAYS);
        var commitDatesSorted = pipe(map(prop("date")), sortWith([descend(pathOr("", ["year", "month", "day", "hour"]))]))(commits);
        var firstCommit = new Date(pathOr(0, [0, "year"], commitDatesSorted), pathOr(0, [0, "month"], commitDatesSorted), pathOr(0, [0, "day"], commitDatesSorted)).toDateString();
        var lastCommit = new Date(pathOr(0, [-1, "year"], commitDatesSorted), pathOr(0, [-1, "month"], commitDatesSorted), pathOr(0, [-1, "day"], commitDatesSorted)).toDateString();
        var repoStats = {
            totalCommits: totalCommits,
            authors: authors,
            commitsByAuthor: commitsByAuthor,
            commitsByDayHour: commitsByDayHour,
            commitsByWeekDay: commitsByWeekDay,
            firstCommit: firstCommit,
            lastCommit: lastCommit,
        };
        logMsg(repoStats);
    });
};
var main = function () {
    logMsg("Getting repository log...");
    checkIsInsideGitDir();
    logMsg("Calculating stats...");
    getGitLogStats();
};
main();
