!function( $ ){

  'use strict';

 /* LIST CLASS DEFINITION
  * ========================= */

  var Megalist = function(element, $parent) {
    var srcElement, dstElement;

    //functional suffixes for multiselect
    this.DESTINATION_SUFFIX = 'dst';
    this.SOURCE_SUFFIX = 'src';

      if ($parent == undefined){
        this.$el = element;

        this.$el.html('');

         //crate 2 containers for megalists and append them
        srcElement = $( '<div/>', {
            id: this.$el.attr('id') + '_' + this.SOURCE_SUFFIX,
            class: 'megalist-inner'
        });
        dstElement = $( '<div/>', {
            id: this.$el.attr('id') + '_' + this.DESTINATION_SUFFIX,
            class: 'megalist-inner'
        });
        this.$el.append(srcElement, dstElement);

        this.srcMegalist = new Megalist(srcElement, this.$el);
        this.dstMegalist = new Megalist(dstElement, this.$el);

        this.srcMegalist.targetList = this.dstMegalist;
        this.dstMegalist.targetList = this.srcMegalist;

        this.srcMegalist.destinationList = this.dstMegalist;
        this.dstMegalist.destinationList = this.dstMegalist;
    } else {
        this.init(element, $parent);
    }
    return this;
  };

  Megalist.prototype = {

    constructor: Megalist,

    /**
     * megalistSide constructor - initializes one side of megalist
     *
     * @param {object} element - jQuery object on witch megalist is initialized
     * @param {object} $parent - optional jQuery object with parent for
     *                           megalistSide initialization only
     * @return {object} - returns self
     */
    init: function(element, $parent) {
        this.$el = element;
        this.$parent = $parent;

        this.SCROLLBAR_BORDER = 1;
        this.SCROLLBAR_MIN_SIZE = 10;
        this.RESIZE_TIMEOUT_DELAY = 100;
        this.MINIMUM_SEARCH_QUERY_SIZE = 2;
        this.BUILD_FULL_POST = false;
        this.MOVE_ACTION_NAME = 'move';

        //defaults
        this.processedItems = {};
        this.totalItems = [];
        this.itemHeight = -1;
        this.listItems = $();
        this.suffix = undefined;
        this.yPosition = 0;
        this.filteredData = [];

        //init widget
        this.getSuffix();
        this.buildDOM();
        this.bindEvents();
        this.bindData();
        this.updateLayout();

        if (this.suffix === this.DESTINATION_SUFFIX) {
            this.generatePOST(this.BUILD_FULL_POST);
        }

        return this;
    },

    /**
     * Builds required html elements for megalistSide:
     * searchbox, scrollbar, move button and hidden result input
     */
    buildDOM: function() {
        var scrollbarWidth;

        this.$el.wrap('<div class="megalist"></div>"');

        this.$search = $( '<input/>', {
            id: this.$el.attr('id') + '_search',
            placeholder: 'Search',
            type: 'text'
        });
        this.$scrollbar = $( '<div/>', {
            id: this.$el.attr('id') + '_scrollbar',
            class: 'scrollbar'
        });
        this.$moveall = $( '<input/>', {
            class: 'button',
            type: 'button',
            value: 'move all'
        });
        this.$input = $( '<input/>', {
            name: this.name,
            type: 'hidden'
        });
        this.$ul = $('<ul />');

        this.$el.before(this.$search)
                .append(this.$ul, this.$scrollbar)
                .after(this.$moveall);

        this.$ul.css('visibility', 'visible');

        // Set tabindex, so the element can be in focus
        this.$el.attr('tabindex', '-1');

        scrollbarWidth = parseInt(this.$scrollbar.css('width'), 10);
        this.$scrollbar.css('width', 1.25 * scrollbarWidth);
    },

    /**
     * Resolves suffix for megalistSide so that it know if it's source or
     * destination side. Resolving is based on id of the container
     */
    getSuffix: function() {
        var id_tokens, lastToken;

        id_tokens = this.$el.attr('id').split('_');
        lastToken = id_tokens[id_tokens.length - 1];
        this.name = id_tokens.splice(id_tokens, id_tokens.length-1).join('_');

        if (lastToken === this.SOURCE_SUFFIX) {
            this.suffix = this.SOURCE_SUFFIX;
        } else if (lastToken === this.DESTINATION_SUFFIX) {
            this.suffix = this.DESTINATION_SUFFIX;
        } else {
            console.log(
                'Ids of multiselect widget elements must end with' +
                '"_src" or "_dst"'
            );
        }
    },

    /**
     * Binds all events need by the widget
     */
    bindEvents: function() {
        var self = this;

       $(window).resize(function(event){
            return self.onResize(event);
        });

        $(window).bind('keydown', function(event) {
            return self.onKeydown(event);
        });

        this.$el.mousedown(function() {
            this.focus();
        });

        this.$el.bind('mousewheel DOMMouseScroll', function(event) {
            event.preventDefault();
            return self.onMouseWheel(event);
        });

        this.$el.click(function(event) {
            self.processListClick(event);
        });

        this.$scrollbar.bind('mousedown', function(event) {
             self.onScrollbarStart(event);
        });

        this.$moveall.click(function(event) {
            self.onMoveAll(event);
        });

        this.$search.on('keyup', function() {
            self.yPosition = 0;
            self.filterList();
        });
    },

    /**
     * Extracts the supplied data for megalistSide from data-provider-src or
     * data-provider-dst attributes depending which side is being loaded.
     * The attributes must be set on megalist container.
     */
    bindData: function() {
        this.origData = this.$parent.attr('data-provider-' + this.suffix);
        if (this.origData.length){
            this.dataProviderOrig =  this.parseData(this.origData);
            this.$parent.attr('data-provider-' + this.suffix, '')
        } else {
            this.dataProviderOrig = {};
        }

        this.dataProvider = this.dataProviderOrig;

        this.clearSelectedIndex();

        this.$ul.find('li').each(function() {
            $(this).remove();
        });

        this.yPosition = 0;
    },

    /**
     * Parses the data extracted from container attribues. Currently two
     * formats are supported: JSON and passing old <select> element that
     * is being replaced by this widget
     *
     * @param {string} origData - string extracted from attribute
     *                            (JSON or old select html)
     * @return {Array} parsed - parsed data array
     */
    parseData: function(origData){
        var parsed = [], item = {};
        var selected = ':not(:selected)';

        //first see if it's JSON
        try {
          parsed = $.parseJSON(origData);
        } catch(e) {
          //not JSON
        }
        //ok, maybe it's being fed <option>s from an old select?
        if (origData.indexOf('<select') > -1){
          if (this.suffix === this.DESTINATION_SUFFIX) {
              selected = ':selected';
          }
           $.map($('option', origData).filter(selected), function(opt){
               item["listValue"] = opt.value;
               item["label"] = opt.text;
               parsed.push(item)
               item = {};
           })
        }

        return parsed;
    },

    /**
     * Updates responsive mutliselect on window resize by recalculating new
     * sizing and redrawing megalistSide widgets. Updating has some inertia
     * added resizing only after RESIZE_TIMEOUT_DELAY is reached
     *
     * @param {event} event - window resize event
     */
    onResize: function(event) {
        clearTimeout(this.reizeTimeout);
        var self = this,
            totalHeight = this.dataProvider.length * this.itemHeight,
            maxPosition = totalHeight - this.$el.height();

        this.yPosition = Math.min(this.yPosition, maxPosition);
        this.reizeTimeout = setTimeout(function() {
            self.updateLayout();
        }, this.RESIZE_TIMEOUT_DELAY);
    },

    /**
    * @TODO - @FIXME
    * @param {event} event - user key press event
    */
    onKeydown: function (event) {
        var delta = 0,
            action = this.MOVE_ACTION_NAME,
            self = this,
            oldindex = this.getSelectedIndex(),
            index = oldindex + delta;

        if (!this.$el.is(':focus')) {
            return;
        }

        switch (event.which) {
            case 33:  // Page up
                delta = -1 * Math.floor(this.$el.height() / this.itemHeight);
                break;

            case 34:  // Page down
                delta = Math.floor(this.$el.height() / this.itemHeight);
                break;

            case 38:  // Up
                delta = -1;
                break;

            case 40:  // Down
                delta = 1;
                break;

            default:
                return;
        }

        if (index > this.dataProvider.length -1) {
            index = this.dataProvider.length;
        }
        if (index < 0) {
            index = 0;
        }

        if (index === oldindex) {
            return false;
        }

        this.setSelectedIndex(index);

        if (this.yPosition > (index * this.itemHeight)) {
            this.yPosition = (index*this.itemHeight);
        }
        if (this.yPosition < ((index+1) * this.itemHeight) - this.$el.height()) {
            this.yPosition = ((index+1)*this.itemHeight) - this.$el.height();
        }

        this.updateLayout();
        this.cleanupTimeout = setTimeout(function() {
            self.cleanupListItems();
        }, 100);

        var target = this.$ul.find('.megalistSelected');

        setTimeout(function() {
            var event = $.Event(action, data),
                data = {
                    selectedIndex: index,
                    srcElement: $(target),
                    item: self.dataProvider[index],
                    destination: self.$el.attr('id')
                };
            self.$el.trigger(event);
        }, 150);

        return false;
    },

    /**
     * Updates megalistSide widget on mouse scroll event
     * only concerned about vertical scroll
     * scroll wheel logic from jquery.mousewheel.js, project page at
     * https://github.com/brandonaaron/jquery-mousewheel
     *
     * @param {event} event - mouse wheel event
     */
    onMouseWheel: function (event) {
        clearTimeout(this.cleanupTimeout);

        var self = this,
            orgEvent = event.originalEvent,
            delta = 0,
            totalHeight = this.dataProvider.length * this.itemHeight,
            maxPosition = totalHeight - this.$el.height();

        // Old school scrollwheel delta
        if (orgEvent.wheelDelta) {
            delta = orgEvent.wheelDelta / 120;
        }
        if (orgEvent.detail) {
            delta = -orgEvent.detail / 3;
        }

        // Webkit
        if ( orgEvent.wheelDeltaY !== undefined ) {
            delta = orgEvent.wheelDeltaY / 120;
        }

        this.yPosition -= delta * this.itemHeight;

        //limit the mouse wheel scroll area
        if (this.yPosition > maxPosition) {
            this.yPosition = maxPosition;
        }
        if (this.yPosition < 0) {
            this.yPosition = 0;
        }

        this.updateLayout();
        this.cleanupTimeout = setTimeout(function() {
            self.cleanupListItems();
        }, 100);

        return false;
    },

    processListClick: function(event) {
        var self = this,
            target = event.target,
            index = $(target).attr('list-index'),
            out_data = this.dataProvider[index],
            clicked_value = this.dataProvider[index];

        while (target.parentNode !== null) {
            if (target.nodeName === 'LI') {
                break;
            }
            target = target.parentNode;
        }

        if (target.nodeName !== 'LI') {
            return false;
        }

        if (index === this.selectedIndex) {
            return false;
        }

        this.setSelectedIndex(index);

        this.targetList.updateDataProvider(out_data);

        self.clearSelectedIndex();

        self.dataProviderOrig.splice(
            self.dataProviderOrig.indexOf(clicked_value), 1
        );
        self.filterList();
        this.destinationList.generatePOST(this.BUILD_FULL_POST);

        return true;
    },

    onMoveAll: function(event){
        var action = 'change',
            out_data = this.dataProvider,
            i;

        this.targetList.updateDataProvider(out_data);

        this.clearSelectedIndex();
        this.dataProvider = [];
        if (this.filteredData.length > 0) {
            for (i = this.filteredData.length - 1; i >= 0; i--) {
                this.dataProviderOrig.splice(this.filteredData[i], 1);
            }
        } else {
            this.dataProviderOrig = [];
        }
        this.destinationList.generatePOST(this.BUILD_FULL_POST);
        this.updateLayout();
    },
    onScrollbarStart: function(event) {
        var self = this;

        this.unbindScrollbarEvents();
        this.scrollbarInputCoordinates = this.getInputCoordinates(event);

        $(window).bind('mousemove', function(event) {
             self.onScrollbarMove(event);
        });

        $(window).bind('mouseup', function(event) {
             self.unbindScrollbarEvents();
        });

        event.preventDefault();
        return false;
    },

    onScrollbarMove: function(event) {
        var newCoordinates = this.getInputCoordinates(event),
            height = this.$el.height(),
            totalHeight = this.dataProvider.length * this.itemHeight,
            scrollbarHeight = this.$scrollbar.height(),
            yDelta = this.scrollbarInputCoordinates.y - newCoordinates.y,
            yPosition = parseInt(this.$scrollbar.css('top'), 10),
            newYPosition;

        // valid move occurs only when pressing left mouse button
        if (event.which !== 1) {
            this.unbindScrollbarEvents();
            return;
        }

        yPosition -= yDelta;

        yPosition = Math.max(yPosition, this.SCROLLBAR_BORDER);
        yPosition = Math.min(
            yPosition,
            height - this.SCROLLBAR_BORDER - scrollbarHeight
        );

        this.$scrollbar.css('top', yPosition);
        this.scrollbarInputCoordinates = newCoordinates;

        newYPosition = (
            (yPosition - this.SCROLLBAR_BORDER) /
            (height - (2 * this.SCROLLBAR_BORDER) - scrollbarHeight) *
            (this.itemHeight * this.dataProvider.length - 1)
        );
        newYPosition = Math.max(0, newYPosition);
        newYPosition = Math.min(
            newYPosition,
            totalHeight - (height - (2 * this.SCROLLBAR_BORDER) - scrollbarHeight)
        );

        this.yPosition = newYPosition;
        this.updateLayout(true);

        event.preventDefault();
        return false;
    },

    unbindScrollbarEvents: function() {
        $(window).unbind('mousemove');
        $(window).unbind('mouseup');
    },

    cleanupListItems: function() {
        //remove any remaining LI elements hanging out on the dom
        var temp = [],
            item, index, x;

        for (x = 0; x < this.totalItems.length; x++ ) {
            item = this.totalItems[x];
            index = item.attr('list-index');
            if (this.processedItems[index] === undefined) {
                item.remove();
            }
        }
        //cleanup totalItems array
        if (this.processedItems) {
            for (index in this.processedItems) {
                temp.push(this.processedItems[index]);
            }
        }
        this.totalItems = temp;
    },

    getInputCoordinates: function (event) {
        var targetEvent = event,
            result = {
                x: Math.round(targetEvent.pageX),
                y: Math.round(targetEvent.pageY)
            };
        return result;
    },

    updateLayout: function(ignoreScrollbar) {
        var height = this.$el.height(),
            i = -1,
            startPosition = Math.ceil(this.yPosition / this.itemHeight),
            maxHeight = 2 * (height + (2 * this.itemHeight)),
            index, item, currentPosition, parentLength;

        if (this.dataProvider.length > 0) {
            this.$ul.detach();
            this.setItemPosition(this.$ul, 0, -this.yPosition);
            this.processedItems = {};

            while (i * this.itemHeight < maxHeight) {
                index = Math.min(
                    Math.max(startPosition + i, 0),
                    this.dataProvider.length
                );

                item = this.getItemAtIndex(index);
                this.totalItems.push(item);

                this.processedItems[index.toString()] = item;
                currentPosition = (startPosition + i) * this.itemHeight;
                this.setItemPosition(item, 0, currentPosition);

                if (item.parent().length <= 0) {
                    this.$ul.append(item);

                    if (this.itemHeight <= 0) {
                        item.html('&nsbp;');
                        this.$el.append(this.$ul);
                        this.itemHeight = item.outerHeight();
                        this.updateLayout();
                        return;
                    }
                }
                i++;
            }

            this.cleanupListItems();
            if (ignoreScrollbar !== true) {
                this.updateScrollBar();
            }
            if (this.$scrollbar.parent().length > 0){
                this.$scrollbar.before(this.$ul);
            } else {
                 this.$el.append(this.$ul);
            }
        } else {
            if (this.$ul.children().length > 0) {
                this.$ul.empty();
                this.cleanupListItems();
                parentLength = this.$scrollbar.parent().length > 0;
                if (ignoreScrollbar !== true && parentLength > 0) {
                    this.updateScrollBar();
                }
            }
        }
    },

    updateScrollBar: function() {
        var height = this.$el.height(),
            maxScrollbarHeight = height - (2 * this.SCROLLBAR_BORDER),
            maxItemsHeight = (this.dataProvider.length) * this.itemHeight,
            targetHeight = maxScrollbarHeight * Math.min(
                maxScrollbarHeight / maxItemsHeight, 1
            ),
            actualHeight = Math.max(targetHeight, this.SCROLLBAR_MIN_SIZE),
            scrollPosition = (
                this.SCROLLBAR_BORDER + (
                    this.yPosition / (maxItemsHeight - height) *
                    (maxScrollbarHeight - actualHeight)
                )
            ),
            parent = this.$scrollbar.parent();

        if (scrollPosition < this.SCROLLBAR_BORDER) {
            actualHeight = Math.max(actualHeight + scrollPosition, 0);
            scrollPosition = this.SCROLLBAR_BORDER;
        } else if (scrollPosition > (height - actualHeight)) {
            actualHeight = Math.min(
                actualHeight, height - scrollPosition + this.SCROLLBAR_BORDER
            );
        }

        this.$scrollbar.height(actualHeight);

        if ((this.dataProvider.length * this.itemHeight) <= height) {
            if (parent.length > 0) {
                this.$scrollbar.detach();
            }
        } else {
            if (parent.length <= 0) {
                this.$el.append(this.$scrollbar);
            }
            this.$scrollbar.css('top', scrollPosition);
        }
    },

    /**
     * Utility function so set offset css on an item
     *
     * @param {object} item - megalist element
     * @param {int} x - x offset in pixels
     * @param {int} y - y offset in pixels
     */
    setItemPosition: function(item, x, y) {
        item.css('left', x);
        item.css('top', y);
    },

    /**
     * Gets megalist item at given index. Parses it to <li> item if necessary
     *
     * @param {int} i - object index
     * @return {object} - jQuery object containing selected <li> element
     */
    getItemAtIndex: function(i) {
        var item, iString, data;
        if (this.dataProvider === this.listItems) {
            item = $(this.listItems[i]);
        }
        else if (i !== undefined){
            iString = i.toString();

            if (this.listItems[iString] === null ||
                this.listItems[iString] === undefined
            ) {
                item = $('<li class="megalistItem" />');
                this.listItems[iString] = item;
            } else {
                item = $(this.listItems[i]);
            }

            if (i >= 0 && i < this.dataProvider.length){
                data = this.dataProvider[i];
                item.html(data.label);
                item.attr('list-value', data.listValue);
            }
        }
        if (item !== null && item !== undefined) {
            item.attr('list-index', i);
        }
        return item;
    },

    getSelectedIndex: function() {
        return parseInt(this.selectedIndex, 10);
    },

    setSelectedIndex: function(index) {
        var item = this.getItemAtIndex(this.selectedIndex);

        if (item !== undefined) {
            item.removeClass('megalistSelected');
        }

        this.selectedIndex = index;
        this.getItemAtIndex(index).addClass('megalistSelected');
    },

    clearSelectedIndex: function() {
        var item = this.getItemAtIndex(this.selectedIndex);

        if (item !== undefined) {
            item.removeClass('megalistSelected');
        }
        this.selectedIndex = -1;
    },

    /**
     * Sets initial data for megalist and updates layout with it
     *
     * @param {Array} dataProvider - object array to initially feed megalist
     */
    setDataProvider: function(dataProvider) {
        this.clearSelectedIndex();
        this.dataProviderOrig = dataProvider;
        this.dataProvider = dataProvider;

        this.$ul.find('li').each(function() {
            $(this).remove();
        });

        this.yPosition = 0;
        this.updateLayout();
    },

    /**
     * Updates megalist with new data. Accepts either a single object or
     * an Array of objects and updates layout with new data
     *
     * @param {object|Array} newElement - new object / array of objects
     *                                    to be inserted into the list
     */
    updateDataProvider: function(newElement) {
        this.clearSelectedIndex();

        if ($.isArray(newElement)) {
            $.merge(this.dataProviderOrig, newElement);
        } else {
            this.dataProviderOrig.push(newElement);
        }
        this.filterList();

        this.$ul.find('li').each(function() {
            $(this).remove();
        });

        this.yPosition = 0;
        this.itemHeight = 0;
        this.updateLayout();
    },

    /**
     * Returns current objects in megalist
     *
     * @return {Array} - list of objects in megalist
     *
     */
    getDataProvider: function() {
        return this.dataProvider;
    },

    setLabelFunction: function(labelFunction) {
        this.labelFunction = labelFunction;
        this.updateLayout();
    },

    filterList: function() {
        var self = this,
            searchQuery = this.$search.val().toLowerCase().trim(),
            searchTokens = searchQuery.split(' '),
            isQueryValid = searchQuery.length < this.MINIMUM_SEARCH_QUERY_SIZE,
            i;

        this.filteredData = [];

        for (i = searchTokens.length - 1; i >= 0; i--) {
            searchTokens[i] = searchTokens[i].trim();
        }

        if (isQueryValid) {
            this.dataProvider = this.dataProviderOrig;

        } else {
            this.dataProvider = $.grep(
                this.dataProviderOrig,
                function(val, index) {
                    return self.testListElement(val, searchTokens, index);
                }
            );
        }

        this.updateLayout();
    },

    testListElement: function(val, searchTokens, index) {
        var tokenIndex = 0,
            valI = 0,
            i;
        val = val.label.toLowerCase();
        while (valI < val.length) {
            if (val[valI++] === searchTokens[tokenIndex][0]) {
                for (i = 1; i < searchTokens[tokenIndex].length; i++) {
                    if (val[valI++] !== searchTokens[tokenIndex][i]) {
                        return false;
                    }
                }
                if (++tokenIndex === searchTokens.length) {
                    this.filteredData[this.filteredData.length] = index;
                    return true;
                }
            }
        }
        return false;
    },

    /**
    * Generates string result of what is currently selected and populates
    * this.$input value, adding it to DOM id necessary. Only does it for
    * destination list. Result can be in 2 formats: POST-like (full) or comma
    * separated
    * @param {boolean} full - wherever to generate full POST-like data
    * @return {string} result - string result of what is currently selected
    */
    generatePOST: function(full) {
      var i,
          postData = [],
          result = {},
          name = this.name + '[]';

      if (this.suffix === this.DESTINATION_SUFFIX){
          for (i = 0; i < this.dataProviderOrig.length; i++) {
              postData[i] = this.dataProviderOrig[i].listValue;
          }
          if (full === true){
              result[name] = postData;
              result = decodeURIComponent($.param(result));
              this.$input.val(result);
          } else {
              result = postData.join(',');
              this.$input.val(result);
          }

          if (this.$el.has(this.$input).length < 1) {
              this.$el.append(this.$input);
          }
          return result;
      } else {
          return '';
      }
    }

  };

  /* LIST PLUGIN DEFINITION
   * ========================== */

  $.fn.megalist = function (option, params) {
    var multiselect = new Megalist(this);
    if (typeof option === 'string') { this.result = multiselect[option](params); }
    return this;
  };

} (window.jQuery);
