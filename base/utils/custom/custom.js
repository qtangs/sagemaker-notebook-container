/**
 * https://github.com/jupyter/notebook/blob/master/notebook/static/custom/custom.js
 * Add Open JupyterLab button
 */
define([
  'jquery'
],
function ($) {
  /**
   * Adds the 'Open JupyterLab' link to the upper-right corner of the Tree page.
   */
  function addJupyterLabButton() {
    // The "Quit" button was recently added to Jupyter, so we know that if this button exists,
    // then JupyterLab is also there.
    $('#shutdown').before(
      '<button '
      + 'id="open_jupyter_lab" '
      + 'class="btn btn-sm navbar-btn" '
      // Style copied directly from page.less for so it matches the #shutdown button.
      + 'style="color: #333; background-color: #fff; border-color: #ccc; margin-left: 10px;" '
      + 'title="Open JupyterLab">'
      + 'Open JupyterLab'
      + '</button>'
    );
    $('#open_jupyter_lab').click(function (e) {
      e.preventDefault();
      e.stopPropagation();
      window.location.href = '/lab';
    });
  }

  $(document).ready(addJupyterLabButton());

  if (typeof exports !== 'undefined') {
    // Export functions
    exports.addJupyterLabButton = addJupyterLabButton;
  }
  return exports;
});
