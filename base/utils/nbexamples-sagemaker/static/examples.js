// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

define([
    'base/js/namespace',
    'jquery',
    'underscore',
    'base/js/utils',
    'base/js/dialog',
], function(Jupyter, $, _, utils, dialog) {
    "use strict";

    var Examples = function (
            categories,
            options) {

        options = options || {};
        this.options = options;
        this.base_url = options.base_url || utils.get_body_data("baseUrl");

        var category_elements = {};
        categories.forEach(function(category){
            category_elements[category['name']] = $('#' + category['id'])
        });
        this.category_elements = category_elements;

        this.dialog_element = this.make_save_as_dialog().appendTo('body');
        this.bind_events();
   };

    Examples.prototype.bind_events = function () {
        var that = this;
        $('#refresh_examples_list').click(function () {
            that.load_list();
        });

        // Hide the modal dialog on submit. The declarative attribute does
        // not work when form submission is involved.
        this.dialog_element.on('submit', '.modal-dialog form', function(evt) {
            $(evt.target).closest('.modal').modal('hide');
        });

        // Show the singleton dialog when the user clicks the use button for any
        // example. Set the example ID in the hidden element field.
        for (var key in this.category_elements) {
            this.category_elements[key].on('click', '[data-filepath]', function(evt) {
                var filepath = $(evt.target).data('filepath');
                var basename = $(evt.target).data('basename');
                var notebook_folder_name = $(evt.target).data('notebook_folder_name');
                var supporting_items = _.filter($(evt.target).data('supporting_items').split(','));

                that.dialog_element
                    .find('[name="example_id"]')
                    .val(filepath);
                that.dialog_element
                    .find('[name="dest"]')
                    .val(basename);
                that.show_supporting_items_list(notebook_folder_name, supporting_items);
                that.dialog_element.modal('show');
            });
        }
    };

    Examples.prototype.load_list = function () {
        var settings = {
            processData : false,
            cache : false,
            type : "GET",
            dataType : "json",
            success : $.proxy(this.load_list_success, this),
            error : utils.log_ajax_error,
        };
        var url = utils.url_join_encode(this.base_url, 'examples');
        $.ajax(url, settings);
    };

    Examples.prototype.clear_list = function () {
        // remove list items and show placeholders
        for (var key in this.category_elements) {
            this.category_elements[key].children('.list_item').remove();
            this.category_elements[key].children('.list_placeholder').show();
        }
    };

    Examples.prototype.load_list_success = function (examples, status, xhr) {
        this.clear_list();
        examples = _.sortBy(examples, function(example) {
            return example.metadata.title || example.basename;
        });
        for (var i = 0; i < examples.length; i++) {
            var element = $('<div/>');
            new Example(element,
                examples[i],
                this.options
            );

            this.category_elements[examples[i]['category']].append(element);
            this.category_elements[examples[i]['category']].children('.list_placeholder').hide()
        }
    };

    Examples.prototype.make_save_as_dialog = function () {
        var modal_header = $('<div>')
                        .addClass('modal-header')
                        .append(
                            $('<h4>')
                            .attr({id: 'nbexamples-modal-label'})
                            .addClass('modal-title')
                            .text('Create a copy in your home directory')
                        );
        var modal_footer = $('<div>')
                        .addClass('modal-footer')
                        .append(
                            $('<button>')
                            .addClass('btn btn-default')
                            .attr({'data-dismiss' : 'modal', type : 'button'})
                            .text('Cancel'))
                        .append(
                            $('<button>')
                            .addClass('btn btn-primary aws-custom')
                            .attr({type : 'submit'})
                            .text('Create copy')
                        );
        var modal_body = $('<div>')
                        .addClass('modal-body')
                        .append(
                            $('<label>')
                            .addClass('control-label')
                            .attr({'for' : 'nbexamples-clone-name'})
                            .text('Save copy as'))
                        .append('<br/>')
                        .append(
                            $('<input>')
                            .attr({
                                id : 'nbexamples-clone-name',
                                type  : 'text',
                                name : 'dest',
                                style : 'width:75%'
                            }))
                        .append(
                            $('<input>')
                            .attr({type  : 'hidden', name : 'example_id'}))
                        .append('<br/>')
                        .append('<br/>')
                        .append(
                            $('<div>')
                            .attr({id : 'supporting_items'})
                            .html('')
                        );
        var form = $('<form>')
                .attr({
                    'action' : this.base_url + 'examples/fetch',
                    'method' : 'get',
                    'target' : Jupyter._target
                })
                .append(modal_body)
                .append(modal_footer);

        var main_div = $('<div>')
                    .addClass('modal fade')
                    .attr({
                        'tabindex' : '-1',
                        'role' : 'dialog',
                        'aria-labelledby' : 'nbexamples-modal-label'
                    })
                    .append(
                        $('<div>')
                        .addClass('modal-dialog')
                        .attr({'role' : 'document'})
                        .append(
                            $('<div>')
                            .addClass('modal-content')
                            .append(modal_header)
                            .append(form)
                        )
                    );

        return main_div;
    };

    Examples.prototype.show_supporting_items_list = function (notebook_folder_name, supporting_items) {
        $('#supporting_items').html('');
        if (supporting_items.length > 0) {
            $('#supporting_items').append(
                $('<label>')
                .addClass('right-indent')
                .text('Saving the following directory and support files:'));
            $('#supporting_items').append('<br/>');
            $('#supporting_items').append(
                $('<label>')
                .addClass('right-indent')
                .text('Files / ' + notebook_folder_name + ' / '));
            $('#supporting_items').append(
                $('<div>')
                .attr({
                    id: 'items'
                }));

            var supporting_items_list_element = $('<ul>');
            supporting_items.forEach(function(item){
                supporting_items_list_element.append($('<li>', {html:item}));
            });
            $('#items').append(supporting_items_list_element);
        } else {
            $('#supporting_items').append(
                $('<label>')
                .addClass('right-indent')
                .text('Saving the following directory:'));
            $('#supporting_items').append('<br/>');
            $('#supporting_items').append(
                $('<label>')
                .addClass('right-indent')
                .text('Files / ' + notebook_folder_name));
        }
    }

    var Example = function (element, example, options) {
        this.element = $(element);
        this.example = example;
        this.options = options;
        this.base_url = options.base_url || utils.get_body_data("baseUrl");
        this.style();
        this.make_row();
    };

    Example.prototype.style = function () {
        this.element.addClass('list_item').addClass("row");

        // If this example is active, highlight it
        if(this.options.active_example_id === this.example.filepath) {
            this.element.addClass('bg-info');
            // Clear the active pointer so that it doesn't highlight again when
            // the user refreshes the list
            this.options.active_example_id = null;
        }
    };

    Example.prototype.hash = function(s){
        return s.split("").reduce(function(a,b){a=((a<<5)-a)+b.charCodeAt(0);return a&a},0);
    }

    Example.prototype.make_row = function () {
        this.element.empty();

        var row = $('<div/>').addClass('col-md-12');

        var display_title = this.example.metadata.title || this.example.filename
        row.append($('<span/>').addClass('item_name').text(display_title));

        var btns = $('<div/>').addClass('item-buttons pull-right');
        btns.append($('<a/>')
            .attr("href",
                utils.url_join_encode(this.base_url, "examples/preview") +
                "?example_id=" +
                encodeURIComponent(this.example.filepath))
            .addClass("btn btn-info btn-xs aws-custom")
            .attr("target", Jupyter._target)
            .text('Preview'));
        btns.append($('<button/>')
            .addClass("btn btn-success btn-xs aws-custom")
            .attr('data-filepath', this.example.filepath)
            .attr('data-basename', this.example.basename)
            .attr('data-supporting_items', this.example.supporting_items)
            .attr('data-notebook_folder_name', this.example.notebook_folder_name)
            .text('Use'));
        row.append(btns);
        this.element.append(row);
    };

    return {
        'Examples': Examples,
        'Example': Example
    };
});