module.exports = function(grunt) {

    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON("package.json"),
        jsbeautifier: {
            files: ["Gruntfile.js", "*.js", "test/*.js"]

        },
        env: {
            coverage: {
                APP_DIR_FOR_CODE_COVERAGE: "../test/coverage/instrument/app/"
            }
        },
        eslint: {
            files: {
                options: {
                    configFile: "eslint.json",
                    fix: true,
                    rulesdir: ["eslint_rules"]
                },
                src: ["Gruntfile.js", "*.js", "test/*.js"]
            }
        },
        coveralls: {
            // Options relevant to all targets
            options: {
                // When true, grunt-coveralls will only print a warning rather than
                // an error, to prevent CI builds from failing unnecessarily (e.g. if
                // coveralls.io is down). Optional, defaults to false.
                force: false
            },

            your_target: {
                // LCOV coverage file (can be string, glob or array)
                src: "coverage/*.info",
                options: {
                    // Any options for just this target
                }
            },
        }

    });

    // Load the plugin that provides the "uglify" task.
    grunt.loadNpmTasks("grunt-jsbeautifier");
    grunt.loadNpmTasks("grunt-eslint");
    grunt.loadNpmTasks("grunt-coveralls");
    // Default task(s).
    grunt.registerTask("default", ["jsbeautifier", "eslint"]);
    grunt.registerTask("cover", ["coveralls"]);

};
