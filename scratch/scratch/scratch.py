"""TO-DO: Write a description of what this XBlock is."""

import pkg_resources

from xblock.core import XBlock
from xblock.fields import Scope, Integer
from xblock.fragment import Fragment


class ScratchXBlock(XBlock):
    """
    TO-DO: document what your XBlock does.
    """

    # Fields are defined on the class.  You can access them in your code as
    # self.<fieldname>.

    # TO-DO: delete count, and define your own fields.
    count = Integer(
        default=0, scope=Scope.user_state,
        help="A simple counter, to show something happening",
    )

    def resource_string(self, path):
        """Handy helper for getting resources from our kit."""
        data = pkg_resources.resource_string(__name__, path)
        return data.decode("utf8")

    # TO-DO: change this view to display your data your own way.
    def student_view(self, context=None):
        """
        The primary view of the ScratchXBlock, shown to students
        when viewing courses.
        """
        html = self.resource_string("static/html/scratch.html")

        frag = Fragment(html.format(self=self))
        frag.add_css(self.resource_string("static/css/scratch.css"))
        frag.add_javascript(self.resource_string("static/js/src/scratch.js"))
        # Blockly
        frag.add_javascript(self.resource_string("static/js/vendor/blockly/blockly_compressed.js"))
        frag.add_javascript(self.resource_string("static/js/vendor/blockly/blocks_compressed.js"))
        frag.add_javascript(self.resource_string("static/js/vendor/blockly/javascript_compressed.js"))
        frag.add_javascript(self.resource_string("static/js/vendor/blockly/uk.js"))
        # JS Interpreter
        frag.add_javascript(self.resource_string("static/js/vendor/blockly/acorn_interpreter.js"))

        frag.initialize_js('ScratchXBlock')
        return frag

    # TO-DO: change this handler to perform your own actions.  You may need more
    # than one handler, or you may not need any handlers at all.
    @XBlock.json_handler
    def increment_count(self, data, suffix=''):
        """
        An example handler, which increments the data.
        """
        # Just to show data coming in...
        assert data['hello'] == 'world'

        self.count += 1
        return {"count": self.count, "url": self.runtime.local_resource_url(self, "public/closure-library/package.json")}

    # TO-DO: change this to create the scenarios you'd like to see in the
    # workbench while developing your XBlock.
    @staticmethod
    def workbench_scenarios():
        """A canned scenario for display in the workbench."""
        return [
            ("ScratchXBlock",
             """<scratch/>
             """),
            ("Multiple ScratchXBlock",
             """<vertical_demo>
                <scratch/>
                <scratch/>
                <scratch/>
                </vertical_demo>
             """),
        ]
