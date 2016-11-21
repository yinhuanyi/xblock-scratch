/* Javascript for ScratchXBlock. */
function ScratchXBlock(runtime, element) {

    var workspace;

    function updateCount(result) {
        $('.count', element).text(result.count);
    }

    var SAVE_CODE_URL = runtime.handlerUrl(element, 'set_blockly_code');
    var LOAD_CODE_URL = runtime.handlerUrl(element, 'get_blockly_code');
    var DELAY_BETWEEN_BLOCK_EXECUTION = 200;
    var MAX_STATEMENTS_COUNT = 1000;

    var codeVersion = 0;
    var activeExecutionTimeout = null;

    $('p', element).click(function (eventObject) {
        $.ajax({
            type: "POST",
            url: handlerUrl,
            data: JSON.stringify({"hello": "world"}),
            success: updateCount
        });
    });
    $("#blocklyCode").click(function (event) {
        if (activeExecutionTimeout != null) {
            clearTimeout(activeExecutionTimeout);
            activeExecutionTimeout = null;
            workspace.highlightBlock(null);
        }

        commitCode();
        var code = Blockly.JavaScript.workspaceToCode(workspace);

        var unprocessedVisualizationPresent = false;
        $("#blocklyCode").text(code);
        var interpreter = new Interpreter(code, initInterpreterAPI);
        interpretNextSteps();

        function interpretNextSteps() {
            while (interpreter.step()) {
                if (unprocessedVisualizationPresent) {
                    unprocessedVisualizationPresent = false;
                    activeExecutionTimeout = setTimeout(interpretNextSteps, DELAY_BETWEEN_BLOCK_EXECUTION);
                    return;
                }
            }
            activeExecutionTimeout = null;
            workspace.highlightBlock(null);
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
            return arr.map(function (arg) {
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

        fetchCode();
    });

    function commitCode() {
        $.ajax({
            type: "POST",
            url: SAVE_CODE_URL,
            data: JSON.stringify({
                code: getCode(),
                version: incrementCodeVersion()
            }),
            success: onCodeCommitted
        });
    }

    function onCodeCommitted(result) {
        if (result.updated) {
            console.info('code updated');
        } else {
            console.warn('code update rejected');
        }
        setCodeVersion(result.version);
    }

    function fetchCode() {
        $.ajax({
            type: "POST",
            url: LOAD_CODE_URL,
            data: JSON.stringify({}),
            success: onCodeFetched
        });
    }

    function onCodeFetched(result) {
        setCode(result.code);
        setCodeVersion(result.version);
    }

    function setCode(xmlCode) {
        var xml = Blockly.Xml.textToDom(xmlCode);
        Blockly.Xml.domToWorkspace(xml, workspace);
    }

    function getCode() {
        var xml = Blockly.Xml.workspaceToDom(workspace);
        return Blockly.Xml.domToText(xml);
    }

    function setCodeVersion(version) {
        codeVersion = version;
    }

    function incrementCodeVersion() {
        return ++codeVersion;
    }

    function getCodeVersion() {
        return codeVersion;
    }
}
