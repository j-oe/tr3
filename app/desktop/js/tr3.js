/*
 tr3.js
 guided help for web applications
 2014, Jan Oevermann
*/

this.tr3 = {
    version: '0.2',
    data: [],
    trigger: 'click',
    gui: {
        question: 'h2',
        content: 'div',
        choices: 'div',
        answer: 'button',
        toggle: 'i'
    },

    init: function(src, options) {
        tr3.doc = src;
        tr3.options = options;

        if (options)['trigger', 'data', 'gui'].forEach(function(key) {
            if (options.hasOwnProperty(key)) tr3[key] = options[key];
        });

        $.get(src).success(function(tree) {
            tr3.build(tree);
        });
    },

    build: function(tree) {

        (question = document.createElement(tr3.gui.question)).setAttribute('class', 'tr3-question');
        (content = document.createElement(tr3.gui.content)).setAttribute('class', 'tr3-content');
        (choices = document.createElement(tr3.gui.choices)).setAttribute('class', 'tr3-choices');

        $('.tr3').empty().append(question, content, choices);

        $('.tr3-back').on(tr3.trigger, function(event) {
            event.preventDefault();
            tr3.back();
        }).addClass('inactive');

        $('.tr3-home').on(tr3.trigger, function(event) {
            event.preventDefault();
            tr3.init(tr3.doc, tr3.options);
        });

        tr3.history = [];
        tr3.log = [];

        tr3.root = $(tree).find('tr3');
        tr3.render(tr3.root);
    },

    render: function(tree) {
        var nodeRender = true,
            nodeName = tree[0].nodeName,
            nodeClass = $(tree).attr('class') ? $(tree).attr('class') : '';

        tr3.log.push({
            'answer': $(tree).attr('in') ? $(tree).attr('in') : $(tree).attr('title'),
            'question': $(tree).attr('out'),
            'nodeclass': nodeClass
        });

        if (nodeName === 'leaf') tr3.save();

        $('.tr3').removeClass().addClass('tr3 ' + nodeName).addClass(nodeClass);
        $('.tr3 *[class^="tr3-"]').empty();

        $(tree).children().each(function(nthNode) {

            var attrValid = $(this).attr('valid'),
                attrInvalid = $(this).attr('invalid');

            if (attrValid !== undefined && tr3.data.indexOf(attrValid) > -1) {
                var nextNode = tree.children().eq(nthNode);

                if (this.nodeName != 'ref') {
                    tr3.render(nextNode);
                } else {
                    var tr3ref = (nextNode.attr('copy')) || nextNode.attr('link');
                    tr3.render(tr3.root.find('*[id = ' + tr3ref + ']'));
                }

                nodeRender = false;
                return nodeRender;
            }

            if (attrInvalid === undefined || tr3.data.indexOf(attrInvalid) === -1) {
                answer = document.createElement(tr3.gui.answer);
                tr3in = $(this).attr('in');

                $(answer).attr({
                    'class': 'tr3-answer',
                    'data-tr3id': nthNode,
                    'data-tr3type': this.nodeName
                }).html(tr3in).appendTo('.tr3-choices');

                $(answer).on(tr3.trigger, function(e) {
                    var tr3id = $(this).attr('data-tr3id'),
                        tr3type = $(this).attr('data-tr3type');

                    var nextNode = tree.children().eq(tr3id);

                    if (tr3type !== 'ref') {
                        tr3.render(nextNode);
                    } else {
                        tr3ref = (nextNode.attr('copy')) || nextNode.attr('link');
                        tr3.render(tr3.root.find('*[id = ' + tr3ref + ']'));
                    }
                });
            }
        });

        if (nodeRender) {
            tr3.history.push(tree);

            var tr3out = $(tree).attr('out');
            $('.tr3-question').html(tr3out);
            $('.tr3-content').removeAttr('style').hide();

            var attrContent = $(tree).attr('content');
            if (attrContent !== undefined) {
                (toggle = document.createElement(tr3.gui.toggle)).setAttribute('class', 'tr3-content-toggle');
                $(toggle).appendTo('.tr3-question').on(tr3.trigger, function() {
                    $('.tr3-content-toggle').toggleClass('tr3-content-toggle-active');
                    $('.tr3-content').toggleClass('tr3-content-active').toggle();
                });

                $('.tr3').trigger('tr3-load-before');
                $('.tr3-content').load(attrContent, function() {
                    $('.tr3').trigger('tr3-load-after');
                });
                $('.tr3-content-toggle').show();
            }

            (tr3.history.length > 1) ? $('.tr3-back').removeClass('inactive') : $('.tr3-back').addClass('inactive');

            $('.tr3').trigger('tr3-ready');
        }
    },

    back: function() {
        if (tr3.history.length > 1) {
            last = tr3.history[tr3.history.length - 2];
            tr3.history.splice(tr3.history.length - 2, 2);

            tr3.render(last);
        }
    },

    send: function() {

    },

    // only for demo
    save: function() {
        logtime = (new Date).toJSON();
        logdata = JSON.stringify(tr3.log);
        localStorage.setItem(logtime, logdata);
    }
}