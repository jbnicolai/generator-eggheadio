'use strict';
var util = require('util');
var fs = require('fs');
var yeoman = require('yeoman-generator');
var _ = require('lodash');
_.str = require('underscore.string');
_.mixin(_.str.exports());
_.str.include('Underscore.string', 'string'); // => true

function capitalize(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}


var generateDeps = function (childStates) {
    var clone = _.clone(childStates)
    if (clone.length == 0) {
        return ''
    }

    clone = clone.sort();

    var output = '"' + clone.shift() + '"';
    _.each(clone, function (cs) {
        output += ', "' + cs + '"';
    })

    return output.replace(/\//g, ".");;
}

var StateProps = function (_itemName_, _statePath_) {
    var that = this;
    this.childStates = [];
    this.itemName = _itemName_;
    this.statePath = _statePath_;
    this.stateName = _statePath_.replace(/\//g, ".");
    this.upperStateName = capitalize(_itemName_);
    this.addDep = function (state) {
        var s = state.replace(/\//g, ".")
        that.childStates.push(s);
    }
}

var StateGenerator = yeoman.generators.Base.extend({
    init: function () {
        this.argument("appName", {type:String, required: true});
        this.upAppName = _.str.capitalize(this.appName);

        var baseStates = [];
        var stateDict = {};
        var states = this.readFileAsString("states.md")
        var split = states.split("\n");
        var i;

        var prev = "";
        var prevWhiteSpaceLength = 0;
        var state = "";
        var item;
        var l;
        for (i = 0; i < split.length; i++) {
            item = split[i];
            if (item.charAt(0) == " ") {
                l = item.match(/^\s+/)[0].length;

                if (l > prevWhiteSpaceLength) {

                    prev = state;
                }

                if (l < prevWhiteSpaceLength) {
                    var indexOfSlash = prev.lastIndexOf("/");
                    prev = prev.substring(0, indexOfSlash);
                }
                state = prev + "/" + item.trim()
                prevWhiteSpaceLength = l;

                //add as a dep to the parent state

                var parent = state.substring(0, state.lastIndexOf("/"));
                stateDict[parent].addDep(state);
            }
            else {
                prev = item;
                state = this.appName + "/" + item;
                prevWhiteSpaceLength = 0;
                baseStates.push(this.appName + "." + item);
            }


            stateDict[state] = new StateProps(item.trim(), state);
        }


        var scripts = [];
        _.each(stateDict, function (stateProps) {
            stateProps.childStates.sort();
            stateProps.deps = generateDeps(stateProps.childStates);

            var script = stateProps.statePath + "/" + stateProps.stateName + '.js';
            var stateHtml = stateProps.statePath + "/" + stateProps.stateName + '.html';

            this.template('_state.js.ejs', script, stateProps);
            this.template('_state.html.ejs', stateHtml, stateProps);

            scripts.push(script);
        }, this)

        var baseProps = {
            appDeps: ", " + generateDeps(baseStates),
            baseStates: baseStates.sort(),
            scripts: scripts,
            appName: this.appName,
            upAppName: this.upAppName
        }

        this.template('_index.html.ejs', 'index.html', baseProps);
        this.template('_app.js.ejs', this.appName + "/" + this.appName + '.js', baseProps);
        this.template('_app.html.ejs', this.appName + "/" + this.appName + '.html', baseProps);
        this.template('_bower.json.ejs', 'bower.json', baseProps);

        this.bowerInstall();




//        _.each(split, function (name) {
//            console.log("create: " + name);
//        })

//        this.stateName = this.args[0];

//        var indexHtml = this.readFileAsString("index.html");
//        indexHtml = indexHtml.replace("</head>", "  <script src=\"" + this.stateName + ".js\"></script>\n</head>");
//        fs.writeFileSync("index.html", indexHtml);
    },

    files: function () {
//        this.upperStateName = capitalize(this.stateName);
//        this.copy('_state.js', this.stateName + '.js', {stateName:this.stateName, upperStateName:this.upperStateName});
//        this.copy('_state.html', this.stateName + '.html', {stateName:this.stateName, upperStateName:this.upperStateName});
    }
});



module.exports = StateGenerator;