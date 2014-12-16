MegaList Multiselect
====================

## Introduction

megalist_multiselect is a jQuery multi-select plugin based on [MegaList by triceam](https://github.com/triceam/MegaList). It creates two megalists that can exchange elements between them, a source and destination list. The destination lists generates input with user selection. Plugin is capable of very large datasets unlike usual select with multiple attribute as it only renders what users sees at any given moments.

For performance optimizations, the list component uses data virtualization techniques, so there are never more list elements in the HTML DOM than what is currently visible on the screen. As the user scrolls through content, the list updates the DOM elements accordingly. This makes scrolling lists of thousands of items extremely fluid.

Plugin can be fed with two types of data: JSON object array or currently used select HTML.

## Examples    
* Demo multiselect created with a json DataProvider of 100,000 items
    * [Online Demo](http://maiiku.github.io/megalist_multiselect/samples/01_megalist_multiselect_demo_json.html)
    * [View Source](https://github.com/maiiku/megalist_multiselect/blob/master/samples/01_megalist_multiselect_demo_json.html)  
* Demo multiselect created with a select tag DataProvider of 1000 items
    * [Online Demo](http://maiiku.github.io/megalist_multiselect/samples/02_megalist_multiselect_demo_select.html)
    * [View Source](https://github.com/maiiku/megalist_multiselect/blob/master/samples/02_megalist_multiselect_demo_select.html)
* Demo multiselect generating simply POST data
    * [Online Demo](http://maiiku.github.io/megalist_multiselect/samples/03_megalist_multiselect_demo_simply_post.html)
    * [View Source](https://github.com/maiiku/megalist_multiselect/blob/master/samples/03_megalist_multiselect_demo_simply_post.html)
* Demo multiselect generating full POST data
    * [Online Demo](http://maiiku.github.io/megalist_multiselect/samples/04_megalist_multiselect_demo_full_post.html)
    * [View Source](https://github.com/maiiku/megalist_multiselect/blob/master/samples/04_megalist_multiselect_demo_full_post.html)
* Demo multiselect Created With a json DataProvider of **one milion items**
    * [Online Demo](http://maiiku.github.io/megalist_multiselect/samples/05_megalist_multiselect_demo_milion.html)
    * [View Source](https://github.com/maiiku/megalist_multiselect/blob/master/samples/05_megalist_multiselect_demo_milion.html)


## API

### Methods

<table>
    <thead>
    <tr>
        <th style="width: 150px;">Method</th>
        <th>Description</th>
    </tr>
    </thead>
    <tbody>
    <tr>
        <td>.megalist(options)</td>
        <td>Initializes a list component. Takes option object as optional
            argument
        </td>
    </tr>
    </tbody>
</table>

### Options

<table>
    <thead>
    <tr>
        <th style="width: 150px;">Option</th>
        <th>Default</th>
        <th>Description</th>
    </tr>
    </thead>
    <tbody>
    <tr>
        <td>SCROLLBAR_MIN_SIZE</td>
        <td>12</td>
        <td>sets the minimum height of the scrollbar in pixels</td>
    </tr>
    <tr>
        <td>RESIZE_TIMEOUT_DELAY</td>
        <td>100</td>
        <td>inertial delay (in ms) for megalist ui update after resize event
            occurs
        </td>
    </tr>
    <tr>
        <td>MINIMUM_SEARCH_QUERY_SIZE</td>
        <td>3</td>
        <td>minimum characters to trigger quicksearch filtering</td>
    </tr>
    <tr>
        <td>BUILD_FULL_POST</td>
        <td>true</td>
        <td>specifies if result should be build as full or simple (comma
            separated ids) post. Simple is faster.
        </td>
    </tr>
    <tr>
        <td>MOVE_ACTION_NAME</td>
        <td>move</td>
        <td>move action event name to trigger</td>
    </tr>
    <tr>
        <td>SOURCE_SUFFIX</td>
        <td>src</td>
        <td>functional suffixes for multiselect: source list suffix</td>
    </tr>
    <tr>
        <td>DESTINATION_SUFFIX</td>
        <td>dst</td>
        <td>functional suffixes for multiselect: destination list suffixr</td>
    </tr>
    <tr>
        <td>PLACEHOLDER_TEXT</td>
        <td>Search</td>
        <td>text to display as search input placeholder</td>
    </tr>
    <tr>
        <td>CONTINOUS_SCROLLING_FIRST_INTERVAL</td>
        <td>500</td>
        <td>time to wait for first continous scrolling (in ms)</td>
    </tr>
    <tr>
        <td>CONTINOUS_SCROLLING_INTERVAL</td>
        <td>60</td>
        <td>time to wait between continous scrolling (in ms)</td>
    </tr>
    </tbody>
</table>

### Events
Megalist exposes a move event for handling when the selected item is moved between lists.

<table>
    <thead>
    <tr>
        <th style="width: 150px;">Event</th>
        <th>Description</th>
    </tr>
    </thead>
    <tbody>
    <tr>
        <td>move</td>
        <td>This event is fired when item is clicked and destination list is
            present. It sends the selected item to destination list, updating
            both lists in process.
        </td>
    </tr>
    </tbody>
</table>
