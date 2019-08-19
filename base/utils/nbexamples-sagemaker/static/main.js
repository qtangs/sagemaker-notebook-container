define(function(require) {
    "use strict";

    var $ = require('jquery');
    var Jupyter = require('base/js/namespace');
    var utils = require('base/js/utils');
    var Examples = require('./examples');

    function create_category_block(category_title, category_id, show) {
        var default_placeholder = $('<div>')
                                .text('Examples are currently unavailable.');
        var collapse_buttons = $('<span>')
                                .addClass('pull-right')
                                .append(
                                    $('<i>')
                                    .addClass('fa fa-fw fa-chevron-down'))
                                .append(
                                    $('<i>')
                                    .addClass('fa fa-fw fa-chevron-right'));
        var list_container_header = $('<div>')
                                    .addClass('panel-heading')
                                    .attr({
                                        'data-toggle' : 'collapse',
                                        'data-target' : '#' + category_id
                                    })
                                    .text(category_title)
                                    .append(collapse_buttons);
        var list_container_body = $('<div>')
                                .addClass('list_container collapse')
                                .attr({id : category_id})
                                .append(
                                    $('<div>')
                                    .addClass('row list_placeholder')
                                    .attr({id : category_id + '_placeholder'})
                                    .append(default_placeholder)
                                );
        // Decide if show / hide category
        if (show) {
            list_container_body.addClass('in');
        } else {
            list_container_header.addClass('collapsed');
        }

        var category_block_div = $('<div>')
                        .addClass('panel panel-default')
                        .attr({'title' : 'Click to expand / collapse category'})
                        .append(list_container_header)
                        .append(
                            $('<div>')
                            .addClass('panel-body')
                            .append(list_container_body)
                        );

        return category_block_div;
    };

    function create_header() {
        var heading_div = $('<div>')
                        .addClass('col-sm-8 no-padding')
                        .append(
                            $('<span>')
                            .attr({id : 'examples_list_info'})
                            .addClass('toolbar_info')
                            .text('A collection of Amazon SageMaker sample notebooks.')
                        );

        var refresh_button = $('<button>')
                            .attr({
                                id : 'refresh_examples_list',
                                'title' : 'Refresh'
                            })
                            .addClass('btn btn-default btn-xs')
                            .append(
                                $('<i>')
                                .addClass('fa fa-refresh')
                            );

        var refresh_div = $('<div>')
                        .addClass('col-sm-4 no-padding tree-buttons')
                        .append(
                            $('<spam>')
                            .attr({id : 'examples_buttons'})
                            .addClass('pull-right toolbar_buttons')
                            .append(refresh_button)
                        );
        var toolbar = $('<div>')
                    .addClass('row list_toolbar')
                    .attr({id : 'examples_toolbar'})
                    .append(heading_div)
                    .append(refresh_div);

        return toolbar;
    };

    function examples_html(categories) {
        var panel_div = $('<div>')
                        .addClass('panel-group');

        // Show first block by default
        panel_div.append(create_category_block(categories[0]['title'], categories[0]['id'], true))
        for (var i = 1; i < categories.length; i++) {
            panel_div.append(create_category_block(categories[i]['title'], categories[i]['id'], false))
        }

        var main_div = $('<div>')
                        .addClass('tab-pane')
                        .attr({id : 'examples'})
                        .append(create_header())
                        .append(panel_div);

        return main_div;
    }

    function load() {
        if (!Jupyter.notebook_list) return;
        var base_url = Jupyter.notebook_list.base_url;
        var settings = {
            processData : false,
            cache : false,
            type : "GET",
            dataType : "json",
            success : function (categories, status, xhr) {
                $('head').append(
                    $('<link>')
                    .attr({
                        'rel' : 'stylesheet',
                        'type' : 'text/css',
                        'href' : base_url + 'nbextensions/nbexamples/examples.css'
                    })
                );
                $(".tab-content").append(examples_html(categories));
                $("#tabs").append(
                    $('<li>')
                    .append(
                        $('<a>')
                        .attr({
                            'id' : 'examples_tab',
                            'href' : '#examples',
                            'data-toggle' : 'tab'
                        })
                        .text('SageMaker Examples')
                        .click(function (e) {
                            window.history.pushState(null, null, '#examples');
                        })
                    )
                );

                // Parse the hash value
                var is_examples = (window.location.hash.indexOf('#examples') === 0);
                var active_example_id;
                if(is_examples) {
                    active_example_id = window.location.hash.substr('#examples'.length);
                }
                var examples = new Examples.Examples(
                    categories,
                    {
                        base_url: Jupyter.notebook_list.base_url,
                        notebook_path: Jupyter.notebook_list.notebook_path,
                        active_example_id: active_example_id
                    }
                );
                examples.load_list();

                if(is_examples) {
                    $('#examples_tab').tab('show');
                }
            },
            error : utils.log_ajax_error,
        };
        var url = utils.url_join_encode(base_url, 'categories');
        $.ajax(url, settings);
    }
    return {
        load_ipython_extension: load
    };
});