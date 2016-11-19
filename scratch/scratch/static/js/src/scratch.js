/* Javascript for ScratchXBlock. */
function ScratchXBlock(runtime, element) {

    var workspace;

    function updateCount(result) {
        $('.count', element).text(result.count);
    }

    var handlerUrl = runtime.handlerUrl(element, 'increment_count');

    $('p', element).click(function (eventObject) {
        $.ajax({
            type: "POST",
            url: handlerUrl,
            data: JSON.stringify({"hello": "world"}),
            success: updateCount
        });
    });
    $("#blocklyCode").click(function (event) {
        "use strict";
        var code = Blockly.JavaScript.workspaceToCode(workspace);
        var MAX_STATEMENTS_COUNT = 1000;
        var unprocessedVisualizationPresent = false;

        $("#blocklyCode").text(code);
        var interpreter = new Interpreter(code, initInterpreterAPI);
        interpretNextSteps();

        function interpretNextSteps() {
            while(interpreter.step()) {
                if (unprocessedVisualizationPresent) {
                    unprocessedVisualizationPresent = false;
                    setTimeout(interpretNextSteps, 100);
                    return;
                }
            }
        }

        function consoleLog() {
            return interpreter.createPrimitive(console.log.apply(console, convertInterpreterArgs(arguments)));
        }

        function highlightBlock() {
            unprocessedVisualizationPresent = true;
            return interpreter.createPrimitive(workspace.highlightBlock.apply(workspace, convertInterpreterArgs(arguments)));
        }

        function convertInterpreterArgs(interpreterArgs) {
            var arr = [];
            [].push.apply(arr, interpreterArgs);
            return arr.map(function(arg) {
                return interpreter.pseudoToNative(arg);
            });
        }

        function initInterpreterAPI(interpreter, scope) {
            interpreter.setProperty(scope, 'MAX_STATEMENTS_COUNT', interpreter.createPrimitive(MAX_STATEMENTS_COUNT), Interpreter.READONLY_DESCRIPTOR);
            interpreter.setProperty(scope, 'executedStatementsCount', interpreter.createPrimitive(0));
            interpreter.setProperty(scope, 'highlightBlock', interpreter.createNativeFunction(highlightBlock));
            interpreter.setProperty(scope, 'alert', interpreter.createNativeFunction(consoleLog));
        }
    });

    $(function ($) {
        Blockly.JavaScript.STATEMENT_PREFIX = 'highlightBlock(%1);\n';
        Blockly.JavaScript.INFINITE_LOOP_TRAP = 'if (++executedStatementsCount > MAX_STATEMENTS_COUNT) throw new Error("Too many statements!");\n';
        Blockly.JavaScript.addReservedWords('highlightBlock,executedStatementsCount,MAX_STATEMENTS_COUNT');

        workspace = Blockly.inject('blocklyDiv',
            {toolbox: document.getElementById('toolbox')});
    });
}
