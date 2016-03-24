/**
 * Copyright 2014-2016 Krisztián Nagy
 * @file This module manages and provides the Graphics settings screen of the Interstellar Armada game.
 * @author Krisztián Nagy [nkrisztian89@gmail.com]
 * @licence GNU GPLv3 <http://www.gnu.org/licenses/>
 * @version 1.0
 */

/*jslint nomen: true, white: true */
/*global define */

/**
 * @param utils Used for managing enums.
 * @param application Used for displaying errors.
 * @param components Used for the components (i.e. Selectors) of the screen.
 * @param screens The graphics screen is an HTMLScreen.
 * @param managedGL Used for the texture filtering enum type.
 * @param game Used for navigation.
 * @param strings Used for translation support.
 * @param armadaScreens Used for common screen constants.
 * @param graphics Used for accessing the graphics settings and setting options.
 */
define([
    "utils/utils",
    "modules/application",
    "modules/components",
    "modules/screens",
    "modules/managed-gl",
    "modules/game",
    "armada/strings",
    "armada/screens/shared",
    "armada/graphics",
    "utils/polyfill"
], function (utils, application, components, screens, managedGL, game, strings, armadaScreens, graphics) {
    "use strict";
    var
            // ------------------------------------------------------------------------------
            // private functions
            _getMapToCaptionAndValueFunction = function (stringCategory) {
                return function (element) {
                    var caption, stringDefinition = stringCategory.PREFIX;
                    // if no prefix is available for this string category, try to grab the caption
                    if (!stringDefinition) {
                        application.showError("Cannot find caption string specified for setting '" + element + "', because no prefix is available for the corresponding string category!");
                        return [element, element];
                    }
                    caption = strings.get(stringDefinition, element);
                    return [caption, element];
                };
            },
            _mapCaption = function (element) {
                return element[0];
            },
            _getOnOffSettingValues = function () {
                return [strings.get(strings.SETTING.ON), strings.get(strings.SETTING.OFF)];
            },
            /**
             * Returns an array of arrays, storing pairs of elements, the first of which is the caption
             * of the setting value in the current language and the second is the setting value
             * it corresponds to
             * @returns String[][2]
             */
            _getFilteringSettingValues = function () {
                return utils.getEnumValues(managedGL.TextureFiltering).map(_getMapToCaptionAndValueFunction(strings.GRAPHICS));
            },
            /**
             * In the same format as the other value arrays
             * @type String[][2]
             */
            _getTextureQualitySettingValues = function () {
                return utils.getEnumValues(graphics.getTextureQualities()).reverse().map(_getMapToCaptionAndValueFunction(strings.SETTING));
            },
            /**
             * In the same format as the other value arrays
             * @type String[][2]
             */
            _getFullRangeSettingValues = function () {
                return [
                    [strings.get(strings.SETTING.VERY_LOW), 0],
                    [strings.get(strings.SETTING.LOW), 1],
                    [strings.get(strings.SETTING.MEDIUM), 2],
                    [strings.get(strings.SETTING.HIGH), 3],
                    [strings.get(strings.SETTING.VERY_HIGH), 4]
                ];
            },
            /**
             * In the same format as the other value arrays
             * @type String[][2]
             */
            _getShaderComplexitySettingValues = function () {
                return graphics.getShaderComplexities().map(_getMapToCaptionAndValueFunction(strings.SETTING));
            },
            /**
             * In the same format as the other value arrays
             * @type String[][2]
             */
            _getShadowQualitySettingValues = function () {
                return [
                    [strings.get(strings.SETTING.LOW), graphics.ShadowMapQuality.LOW],
                    [strings.get(strings.SETTING.MEDIUM), graphics.ShadowMapQuality.MEDIUM],
                    [strings.get(strings.SETTING.HIGH), graphics.ShadowMapQuality.HIGH]
                ];
            },
            /**
             * In the same format as the other value arrays
             * @type String[][2]
             */
            _getShadowDistanceSettingValues = function () {
                return [
                    [strings.get(strings.GRAPHICS.SHADOW_DISTANCE_VERY_CLOSE), 3],
                    [strings.get(strings.GRAPHICS.SHADOW_DISTANCE_CLOSE), 4],
                    [strings.get(strings.GRAPHICS.SHADOW_DISTANCE_MEDIUM), 5],
                    [strings.get(strings.GRAPHICS.SHADOW_DISTANCE_FAR), 6],
                    [strings.get(strings.GRAPHICS.SHADOW_DISTANCE_VERY_FAR), 7]
                ];
            },
            _getMaxDynamicLightsSettingValues = function () {
                return [
                    [strings.get(strings.SETTING.OFF), graphics.DynamicLightsAmount.OFF],
                    [strings.get(strings.SETTING.MINIMUM), graphics.DynamicLightsAmount.MINIMUM],
                    [strings.get(strings.SETTING.FEW), graphics.DynamicLightsAmount.FEW],
                    [strings.get(strings.SETTING.MEDIUM), graphics.DynamicLightsAmount.MEDIUM],
                    [strings.get(strings.SETTING.MANY), graphics.DynamicLightsAmount.MANY],
                    [strings.get(strings.SETTING.MAXIMUM), graphics.DynamicLightsAmount.MAXIMUM]
                ];
            },
            // ------------------------------------------------------------------------------
            // constants
            BACK_BUTTON_ID = "backButton",
            TITLE_HEADING_ID = "title",
            DEFAULTS_BUTTON_ID = "defaultsButton",
            AA_SELECTOR_ID = "aaSelector",
            FILTERING_SELECTOR_ID = "filteringSelector",
            TEXTURE_QUALITY_SELECTOR_ID = "textureQualitySelector",
            LOD_SELECTOR_ID = "lodSelector",
            SHADER_COMPLEXITY_SELECTOR_ID = "shaderComplexitySelector",
            SHADOW_MAPPING_SELECTOR_ID = "shadowMappingSelector",
            SHADOW_QUALITY_SELECTOR_ID = "shadowQualitySelector",
            SHADOW_DISTANCE_SELECTOR_ID = "shadowDistanceSelector",
            MAX_DYNAMIC_LIGHTS_SELECTOR_ID = "maxDynamicLightSelector",
            OPTION_PARENT_ID = "settingsDiv",
            SETTING_ON_INDEX = _getOnOffSettingValues().indexOf(strings.get(strings.SETTING.ON)),
            SETTING_OFF_INDEX = _getOnOffSettingValues().indexOf(strings.get(strings.SETTING.OFF));
    // ##############################################################################
    /**
     * @class Represents the graphics settings screen.
     * @extends HTMLScreen
     */
    function GraphicsScreen() {
        screens.HTMLScreen.call(this,
                armadaScreens.GRAPHICS_SCREEN_NAME,
                armadaScreens.GRAPHICS_SCREEN_SOURCE,
                {
                    backgroundClassName: armadaScreens.SCREEN_BACKGROUND_CLASS_NAME,
                    containerClassName: armadaScreens.SCREEN_CONTAINER_CLASS_NAME
                });
        /**
         * @type SimpleComponent
         */
        this._backButton = this.registerSimpleComponent(BACK_BUTTON_ID);
        /**
         * @type SimpleComponent
         */
        this._titleHeading = this.registerSimpleComponent(TITLE_HEADING_ID);
        /**
         * @type SimpleComponent
         */
        this._defaultsButton = this.registerSimpleComponent(DEFAULTS_BUTTON_ID);
        /**
         * @type Selector
         */
        this._antialiasingSelector = null;
        /**
         * @type Selector
         */
        this._filteringSelector = null;
        /**
         * @type Selector
         */
        this._textureQualitySelector = null;
        /**
         * @type Selector
         */
        this._lodSelector = null;
        /**
         * @type Selector
         */
        this._shaderComplexitySelector = null;
        /**
         * @type Selector
         */
        this._shadowMappingSelector = null;
        /**
         * @type Selector
         */
        this._shadowQualitySelector = null;
        /**
         * @type Selector
         */
        this._shadowDistanceSelector = null;
        /**
         * @type Selector
         */
        this._maxDynamicLightsSelector = null;
        graphics.executeWhenReady(function () {
            this._antialiasingSelector = this._registerSelector(AA_SELECTOR_ID,
                    strings.GRAPHICS.ANTIALIASING.name,
                    _getOnOffSettingValues());
            this._filteringSelector = this._registerSelector(FILTERING_SELECTOR_ID,
                    strings.GRAPHICS.FILTERING.name,
                    _getFilteringSettingValues().map(_mapCaption));
            this._textureQualitySelector = this._registerSelector(TEXTURE_QUALITY_SELECTOR_ID,
                    strings.GRAPHICS.TEXTURE_QUALITY.name,
                    _getTextureQualitySettingValues().map(_mapCaption));
            this._lodSelector = this._registerSelector(LOD_SELECTOR_ID,
                    strings.GRAPHICS.MODEL_DETAILS.name,
                    _getFullRangeSettingValues().map(_mapCaption));
            this._shaderComplexitySelector = this._registerSelector(SHADER_COMPLEXITY_SELECTOR_ID,
                    strings.GRAPHICS.SHADERS.name,
                    _getShaderComplexitySettingValues().map(_mapCaption));
            this._shadowMappingSelector = this._registerSelector(SHADOW_MAPPING_SELECTOR_ID,
                    strings.GRAPHICS.SHADOWS.name,
                    _getOnOffSettingValues());
            this._shadowQualitySelector = this._registerSelector(SHADOW_QUALITY_SELECTOR_ID,
                    strings.GRAPHICS.SHADOW_QUALITY.name,
                    _getShadowQualitySettingValues().map(_mapCaption));
            this._shadowDistanceSelector = this._registerSelector(SHADOW_DISTANCE_SELECTOR_ID,
                    strings.GRAPHICS.SHADOW_DISTANCE.name,
                    _getShadowDistanceSettingValues().map(_mapCaption));
            this._maxDynamicLightsSelector = this._registerSelector(MAX_DYNAMIC_LIGHTS_SELECTOR_ID,
                    strings.GRAPHICS.MAX_DYNAMIC_LIGHTS.name,
                    _getMaxDynamicLightsSettingValues().map(_mapCaption));
        }.bind(this));
    }
    GraphicsScreen.prototype = new screens.HTMLScreen();
    GraphicsScreen.prototype.constructor = GraphicsScreen;
    /**
     * @param {String} name
     * @param {String} propertyLabelID
     * @param {String[]} valueList
     * @returns {Selector}
     */
    GraphicsScreen.prototype._registerSelector = function (name, propertyLabelID, valueList) {
        return this.registerExternalComponent(
                new components.Selector(
                        name,
                        armadaScreens.SELECTOR_SOURCE,
                        {cssFilename: armadaScreens.SELECTOR_CSS},
                        {id: propertyLabelID},
                        valueList),
                OPTION_PARENT_ID);
    };
    /**
     * @override
     */
    GraphicsScreen.prototype._initializeComponents = function () {
        screens.HTMLScreen.prototype._initializeComponents.call(this);
        this._backButton.getElement().onclick = function () {
            graphics.setAntialiasing((this._antialiasingSelector.getSelectedIndex() === SETTING_ON_INDEX));
            graphics.setFiltering(_getFilteringSettingValues()[this._filteringSelector.getSelectedIndex()][1]);
            graphics.setTextureQuality(_getTextureQualitySettingValues()[this._textureQualitySelector.getSelectedIndex()][1]);
            graphics.setMaxLOD(_getFullRangeSettingValues()[this._lodSelector.getSelectedIndex()][1]);
            graphics.setShadowMapping((this._shadowMappingSelector.getSelectedIndex() === SETTING_ON_INDEX));
            graphics.setShadowQuality(_getShadowQualitySettingValues()[this._shadowQualitySelector.getSelectedIndex()][1]);
            graphics.setShadowDistance(_getShadowDistanceSettingValues()[this._shadowDistanceSelector.getSelectedIndex()][1]);
            graphics.setMaxPointLights(_getMaxDynamicLightsSettingValues()[this._maxDynamicLightsSelector.getSelectedIndex()][1]);
            game.closeOrNavigateTo(armadaScreens.SETTINGS_SCREEN_NAME);
            return false;
        }.bind(this);
        this._defaultsButton.getElement().onclick = function () {
            graphics.restoreDefaults();
            this._updateValues();
            return false;
        }.bind(this);
        this._shaderComplexitySelector.onChange = function () {
            graphics.setShaderComplexity(_getShaderComplexitySettingValues()[this._shaderComplexitySelector.getSelectedIndex()][1]);
            if (graphics.isShadowMappingAvailable()) {
                this._shadowMappingSelector.show();
                this._shadowMappingSelector.onChange();
            } else {
                this._shadowMappingSelector.hide();
                this._shadowQualitySelector.hide();
                this._shadowDistanceSelector.hide();
            }
            if (graphics.areDynamicLightsAvailable()) {
                this._maxDynamicLightsSelector.show();
            } else {
                this._maxDynamicLightsSelector.hide();
            }
        }.bind(this);
        this._shadowMappingSelector.onChange = function () {
            if (this._shadowMappingSelector.getSelectedIndex() === SETTING_ON_INDEX) {
                if (graphics.isShadowMappingAvailable()) {
                    this._shadowQualitySelector.show();
                    this._shadowDistanceSelector.show();
                }
            } else {
                this._shadowQualitySelector.hide();
                this._shadowDistanceSelector.hide();
            }
        }.bind(this);
    };
    /**
     * @override
     */
    GraphicsScreen.prototype._updateComponents = function () {
        screens.HTMLScreen.prototype._updateComponents.call(this);
        this._backButton.setContent(strings.get(strings.GRAPHICS.BACK));
        this._titleHeading.setContent(strings.get(strings.GRAPHICS.TITLE));
        this._defaultsButton.setContent(strings.get(strings.SETTINGS.DEFAULTS));
        this._antialiasingSelector.setValueList(_getOnOffSettingValues());
        this._filteringSelector.setValueList(_getFilteringSettingValues().map(_mapCaption));
        this._textureQualitySelector.setValueList(_getTextureQualitySettingValues().map(_mapCaption));
        this._lodSelector.setValueList(_getFullRangeSettingValues().map(_mapCaption));
        this._shaderComplexitySelector.setValueList(_getShaderComplexitySettingValues().map(_mapCaption));
        this._shadowMappingSelector.setValueList(_getOnOffSettingValues());
        this._shadowQualitySelector.setValueList(_getShadowQualitySettingValues().map(_mapCaption));
        this._shadowDistanceSelector.setValueList(_getShadowDistanceSettingValues().map(_mapCaption));
        this._maxDynamicLightsSelector.setValueList(_getMaxDynamicLightsSettingValues().map(_mapCaption));
        this._updateValues();
    };
    /**
     * Updates the component states based on the current graphics settings
     */
    GraphicsScreen.prototype._updateValues = function () {
        graphics.executeWhenReady(function () {
            var findIndexOf = function (value, array) {
                return array.findIndex(function (element) {
                    return element[1] === value;
                });
            };
            this._antialiasingSelector.selectValueWithIndex((graphics.getAntialiasing() === true) ? SETTING_ON_INDEX : SETTING_OFF_INDEX);
            this._filteringSelector.selectValueWithIndex(findIndexOf(graphics.getFiltering(), _getFilteringSettingValues()));
            this._textureQualitySelector.selectValueWithIndex(findIndexOf(graphics.getTextureQuality(), _getTextureQualitySettingValues()));
            this._lodSelector.selectValueWithIndex(findIndexOf(graphics.getMaxLoadedLOD(), _getFullRangeSettingValues()));
            this._shaderComplexitySelector.selectValueWithIndex(findIndexOf(graphics.getShaderComplexity(), _getShaderComplexitySettingValues()));
            this._shadowMappingSelector.selectValueWithIndex((graphics.isShadowMappingEnabled() === true) ? SETTING_ON_INDEX : SETTING_OFF_INDEX);
            this._shadowQualitySelector.selectValueWithIndex(findIndexOf(graphics.getShadowQuality(), _getShadowQualitySettingValues()));
            this._shadowDistanceSelector.selectValueWithIndex(findIndexOf(graphics.getShadowDistance(), _getShadowDistanceSettingValues()));
            this._maxDynamicLightsSelector.selectValueWithIndex(findIndexOf(graphics.getMaxPointLights(), _getMaxDynamicLightsSettingValues()));
        }.bind(this));
    };
    /**
     * @override
     */
    GraphicsScreen.prototype.show = function () {
        screens.HTMLScreen.prototype.show.call(this);
        this._updateValues();
    };
    // -------------------------------------------------------------------------
    // The public interface of the module
    return {
        graphicsScreen: new GraphicsScreen()
    };
});