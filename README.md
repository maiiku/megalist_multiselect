MegaList Multiselect
====================

## Introduction

megalist_multiselect is a jQuery multi-select plugin based on [MegaList by triceam](https://github.com/triceam/MegaList). It creates a two list components - one with source list, other with selected items. Plugin is capable of very large datasets unlike as it does not render all elements of the list.

For performance optimizations, the list component uses data virtualization techniques, so there are never more list elements in the HTML DOM than what is currently visible on the screen. As the user scrolls through content, the list updates the DOM elements accordingly. This makes scrolling lists of thousands of items extremely fluid.

There are two methods that the list component can be used.  One option is to declare the list structure in HTML markup, another option is to specify a dataProvider JSON array, from which the list will create DOM elements.
    
Demo multiselect Created With A DataProvider of 100,000 items:
* [View Sample](http://maiiku.github.io/megalist_multiselect/samples/01_megalist_multiselect_demo.html)
* [View Source](https://github.com/maiiku/megalist_mutiselect/blob/master/samples/01_megalist_multiselect_demo.html)

      
## API   

### Methods       
      
<table>
<thead>
 <tr>
   <th style="width: 150px;">Event</th>
   <th>Description</th>
 </tr>
</thead>
<tbody>
 <tr>
   <td>.megalist()</td>
   <td>Initializes a list component.</td>
 </tr>
 <tr>
   <td>.megalist('setDataProvider', dataProviderArray)</td>
   <td>Initializes a list component.</td>
 </tr>
 <tr>
   <td>.megalist('setLabelFunction', labelFunction)</td>
   <td>Sets the data provider array for the list instance.  There is no concrete limit on the length of the data provider array.  Elements within the array can be of primitive or complex types.</td>
 </tr>
 <tr>
   <td>.megalist('setSelectedIndex', index)</td>
   <td>Set the item at selected index as selected.</td>
 </tr>
 <tr>
   <td>.megalist('getSelectedIndex', index)</td>
   <td>Returns the currently selected index.  If no list item is selected, returns -1.</td>
 </tr>
 <tr>
   <td>.megalist('clearSelectedIndex', index)</td>
   <td>Clears the currently selected item in the list.</td>
 </tr>
</table>    

### Events
Megalist exposes a change event for handling when the selected item in the list changes.
          
<table>
<thead>
 <tr>
   <th style="width: 150px;">Event</th>
   <th>Description</th>
 </tr>
</thead>
<tbody>
 <tr>
   <td>change</td>
   <td>This event is fired when the selected item in the list is changed.  You can access details of the selected item in the list by accessing attributes of the event.  
    <strong>event.index</strong>
    The numeric index for the item in the list that was clicked/touched.
    <strong>event.srcElement</strong>
    A jQuery reference to the list item that was clicked/touched.
    <strong>event.item</strong>
    A reference to the data item for the list item.  If using inline &lt;li&gt; in markup, this will be the same DOM element as event.srcElement.  If using a dataProvider, it will be the object in the dataProvider array corresponding to the selected list item.</td>
 </tr>
</table>