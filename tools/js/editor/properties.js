/**
 * Copyright 2016 Krisztián Nagy
 * @file Provides the content and event handlers for the Properties window of the Interstellar Armada editor.
 * @author Krisztián Nagy [nkrisztian89@gmail.com]
 * @licence GNU GPLv3 <http://www.gnu.org/licenses/>
 * @version 1.0
 */

/*global define, document */
/*jslint white: true, nomen: true, plusplus: true */

/**
 * @param resources Used to obtain the list of available resources for resource reference property selectors
 * @param classes Used to obtain the list of available classes for class reference property selectors
 * @param descriptors Used to obtain the appropriate properties description object
 * @param common Used to create selectors
 */
define([
    "modules/media-resources",
    "armada/classes",
    "editor/descriptors",
    "editor/common"
], function (resources, classes, descriptors, common) {
    "use strict";
    var
            // ------------------------------------------------------------------------------
            // Constants
            CONTROL_ID_PREFIX = "propertyControl_",
            PROPERTIES_ID = "propertiesTable",
            PROPERTY_CLASS = "propertyName",
            CONTROL_CLASS = "propertyControl",
            // ------------------------------------------------------------------------------
            // Private variables
            /**
             * A reference to the selected item the properties of which are displayed
             * @type Editor~Item
             */
            _item,
            /**
             * The module providing the Preview for the item the properties of which are displayed
             * @type Editor~Preview
             */
            _preview;
    // ------------------------------------------------------------------------------
    // Private functions
    /**
     * Changes the property with the given name (key) in the data object, and notifies the preview module of the change
     * @param {String} name The name (key) of the property
     * @param {} value The new value the property is to be changed to
     */
    function _changeData(name, value) {
        _item.data[name] = value;
        _item.reference.reloadData();
        if (_preview) {
            _preview.handleDataChanged(name);
        }
    }
    /**
     * Creates and returns a control that can be used to edit boolean properties.
     * @param {String} name Name of the property to edit
     * @param {Boolean} data The starting value
     * @returns {Element}
     */
    function _createBooleanControl(name, data) {
        var result = document.createElement("input");
        result.type = "checkbox";
        result.checked = data;
        result.name = name;
        result.onchange = function () {
            _changeData(name, result.checked);
        };
        return result;
    }
    /**
     * Creates and returns a control that can be used to edit string properties.
     * @param {String} name Name of the property to edit
     * @param {String} data The starting value
     * @returns {Element}
     */
    function _createStringControl(name, data) {
        var result = document.createElement("input");
        result.type = "text";
        result.value = data;
        result.name = name;
        result.onchange = function () {
            _changeData(name, result.value);
        };
        return result;
    }
    /**
     * @callback NumberControl~changeHandler
     * @param {Element} element The HTML element representing the control the value of which was changed
     */
    /**
     * Creates and returns a control that can be used to edit numeric properties.
     * @param {String} name Name of the property to edit
     * @param {Number} data The starting value
     * @param {Boolean} allowFloats If true, float values are allowed (otherwise only integer values)
     * @param {NumberControl~changeHandler} [changeHandler] The function that should be run on the change event of the control, after 
     * checking the value to be a number
     * @returns {Element}
     */
    function _createNumberControl(name, data, allowFloats, changeHandler) {
        var result = common.createNumericInput(data, allowFloats, function () {
            if (changeHandler) {
                changeHandler(result);
            } else {
                _changeData(name, result.value);
            }
        });
        result.name = name;
        return result;
    }
    /**
     * Creates and returns a control that can be used to edit resource reference properties.
     * @param {String} name Name of the property to edit
     * @param {String} resourceCategory Name of the resource category of the property
     * @param {String} data The starting value
     * @returns {Element}
     */
    function _createResourceReferenceControl(name, resourceCategory, data) {
        var result = common.createSelector(resources.getResourceNames(resourceCategory), data, false, function () {
            _changeData(name, result.value);
        });
        result.name = name;
        return result;
    }
    /**
     * Creates and returns a control that can be used to edit class reference properties.
     * @param {String} name Name of the property to edit
     * @param {String} classCategory Name of the class category of the property
     * @param {String} data The starting value
     * @returns {Element}
     */
    function _createClassReferenceControl(name, classCategory, data) {
        var result = common.createSelector(classes.getClassNames(classCategory), data, false, function () {
            _changeData(name, result.value);
        });
        result.name = name;
        return result;
    }
    /**
     * Creates and returns a control that can be used to edit color properties.
     * @param {String} name Name of the property to edit
     * @param {Number[4]} data The starting value
     * @returns {Element}
     */
    function _createColorControl(name, data) {
        return common.createColorPicker(data, function () {
            _changeData(name, data);
        });
    }
    /**
     * Creates and returns an element that can be used to display the value of properties the type of which is not identified.
     * @param {} data The value of the property to display
     * @returns {Element}
     */
    function _createDefaultControl(data) {
        var result = document.createElement("span");
        result.innerHTML = data.toString();
        return result;
    }
    /**
     * Creates and returns a control that can be used to edit the value of the property described by the passed property description object.
     * Creates the appripriate type of control depending on the type of the property.
     * @param {Object} typeDescriptor Should contain the name and type of the property and possibly additional parameters
     * @param {} data The starting value of the property
     * @returns {Element}
     */
    function _createControl(typeDescriptor, data) {
        var result;
        if (data === undefined) {
            result = _createDefaultControl("inherited");
        } else {
            switch (typeDescriptor.type) {
                case "boolean":
                    result = _createBooleanControl(typeDescriptor.name, data);
                    break;
                case "number":
                    result = _createNumberControl(typeDescriptor.name, data);
                    break;
                case "string":
                    if (typeDescriptor.resourceReference) {
                        result = _createResourceReferenceControl(typeDescriptor.name, typeDescriptor.resourceReference, data);
                    } else if (typeDescriptor.classReference) {
                        result = _createClassReferenceControl(typeDescriptor.name, typeDescriptor.classReference, data);
                    } else {
                        result = _createStringControl(typeDescriptor.name, data);
                    }
                    break;
                case "color":
                    result = _createColorControl(typeDescriptor.name, data);
                    break;
                default:
                    result = _createDefaultControl(data);
            }
        }
        result.setAttribute("id", CONTROL_ID_PREFIX + typeDescriptor.name);
        result.classList.add(CONTROL_CLASS);
        return result;
    }
    // ------------------------------------------------------------------------------
    // The public interface of the module
    return {
        /**
         * Creates the content for the Properties window - the list of available properties and controls to edit their values.
         * @param {Element} element The parent HTML element to add the created content to
         * @param {Editor~Item} item The item for which to display the property values
         * @param {Editor~Preview} preview The module providing the Preview window for the item
         */
        createProperties: function (element, item, preview) {
            var
                    table, row, nameCell, valueCell, descriptor, properties, i;
            table = document.createElement("table");
            table.setAttribute("id", PROPERTIES_ID);
            descriptor = descriptors[item.category];
            properties = Object.keys(descriptor);
            for (i = 0; i < properties.length; i++) {
                row = document.createElement("tr");
                nameCell = document.createElement("td");
                nameCell.classList.add(PROPERTY_CLASS);
                nameCell.innerHTML = descriptor[properties[i]].name;
                row.appendChild(nameCell);
                valueCell = document.createElement("td");
                valueCell.appendChild(_createControl(descriptor[properties[i]], item.data[descriptor[properties[i]].name]));
                row.appendChild(valueCell);
                table.appendChild(row);
            }
            element.appendChild(table);
            _item = item;
            _preview = preview;
        }
    };
});