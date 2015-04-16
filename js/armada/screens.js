/**
 * Copyright 2014-2015 Krisztián Nagy
 * @file 
 * @author Krisztián Nagy [nkrisztian89@gmail.com]
 * @licence GNU GPLv3 <http://www.gnu.org/licenses/>
 * @version 1.0
 */

/*jslint nomen: true, white: true */
/*global define */

define([
    "utils/matrices",
    "modules/components",
    "modules/screens",
    "modules/buda-scene",
    "armada/armada",
    "armada/logic"
], function (mat, components, screens, budaScene, armada, logic) {
    "use strict";

    /**
     * @class Represents the battle screen.
     * @extends screens.HTMLScreenWithCanvases
     * @param {String} name The name by which this screen can be identified.
     * @param {String} source The name of the HTML file where the structure of this
     * screen is defined.
     */
    function BattleScreen(name, source) {
        screens.HTMLScreenWithCanvases.call(this, name, source);

        this._stats = this.registerSimpleComponent("stats");
        this._ui = this.registerSimpleComponent("ui");
        this._smallHeader = this.registerSimpleComponent("smallHeader");
        this._bigHeader = this.registerSimpleComponent("bigHeader");

        this._debugLabel = this.registerSimpleComponent("debugLabel");

        this._crosshair = this.registerSimpleComponent("crosshair");

        var self = this;

        this._loadingBox = this.registerExternalComponent(new components.LoadingBox(name + "_loadingBox", "loadingbox.html", "loadingbox.css"));
        this._infoBox = this.registerExternalComponent(new components.InfoBox(name + "_infoBox", "infobox.html", "infobox.css", function () {
            self.pauseBattle();
        }, function () {
            self.resumeBattle();
        }));

        /**
         * @name BattleScreen#_level
         * @type Level
         */
        this._level = null;
        /**
         * @name BattleScreen#_battleScene
         * @type budaScene
         */
        this._battleScene = null;
        this._simulationLoop = null;
        this._battleCursor = null;
    }

    BattleScreen.prototype = new screens.HTMLScreenWithCanvases();
    BattleScreen.prototype.constructor = BattleScreen;

    BattleScreen.prototype.pauseBattle = function () {
        armada.control().stopListening();
        this._battleCursor = document.body.style.cursor;
        document.body.style.cursor = 'default';
        clearInterval(this._simulationLoop);
        this._simulationLoop = null;
    };

    BattleScreen.prototype.resumeBattle = function () {
        document.body.style.cursor = this._battleCursor || 'default';
        if (this._simulationLoop === null) {
            var prevDate = new Date();
            var freq = 60;
            var self = this;

            this._simulationLoop = setInterval(function ()
            {
                var curDate = new Date();
                armada.control().control();
                self._level.tick(curDate - prevDate);
                self._battleScene.activeCamera.update();
                prevDate = curDate;
            }, 1000 / freq);
            armada.control().startListening();
        } else {
            Application.showError("Trying to resume simulation while it is already going on!", "minor",
                  "No action was taken, to avoid double-running the simulation.");
        }

    };

    BattleScreen.prototype.hide = function () {
        screens.HTMLScreenWithCanvases.prototype.hide.call(this);
        this.pauseBattle();
        this._level = null;
        this._battleScene = null;
    };

    /**
     * Initializes the components of the parent class, then the additional ones for
     * this class (the canvases).
     */
    BattleScreen.prototype._initializeComponents = function () {
        screens.HTMLScreenWithCanvases.prototype._initializeComponents.call(this);
        var canvas = this.getScreenCanvas("battleCanvas").getCanvasElement();
        this._resizeEventListener2 = function () {
            armada.control().setScreenCenter(canvas.width / 2, canvas.height / 2);
        };
        window.addEventListener("resize", this._resizeEventListener2);
        this._resizeEventListener2();
    };

    /**
     * Getter for the _loadingBox property.
     * @returns {LoadingBox}
     */
    BattleScreen.prototype.getLoadingBox = function () {
        return this._loadingBox;
    };

    /**
     * Getter for the _infoBox property.
     * @returns {InfoBox}
     */
    BattleScreen.prototype.getInfoBox = function () {
        return this._infoBox;
    };

    /**
     * Uses the loading box to show the status to the user.
     * @param {String} newStatus The status to show on the loading box. If
     * undefined, the status won't be updated.
     * @param {Number} newProgress The new value of the progress bar on the loading
     * box. If undefined, the value won't be updated.
     */
    BattleScreen.prototype.updateStatus = function (newStatus, newProgress) {
        if (newStatus !== undefined) {
            this._loadingBox.updateStatus(newStatus);
        }
        if (newProgress !== undefined) {
            this._loadingBox.updateProgress(newProgress);
        }
    };

    BattleScreen.prototype.setDebugLabel = function (message) {
        this._debugLabel.setContent(message);
    };

    /**
     * Hides the stats (FPS, draw stats) component.
     */
    BattleScreen.prototype.hideStats = function () {
        this._stats.hide();
    };

    /**
     * Hides the UI (information about controlled spacecraft) component.
     */
    BattleScreen.prototype.hideUI = function () {
        this._ui.hide();
    };

    /**
     * Shows the headers in the top center of the screen.
     */
    BattleScreen.prototype.showHeaders = function () {
        this._bigHeader.show();
        this._smallHeader.show();
    };

    /**
     * Hides the headers.
     */
    BattleScreen.prototype.hideHeaders = function () {
        this._bigHeader.hide();
        this._smallHeader.hide();
    };

    /**
     * Shows the stats (FPS, draw stats) component.
     */
    BattleScreen.prototype.showStats = function () {
        this._stats.show();
    };

    BattleScreen.prototype.showCrosshair = function () {
        this._crosshair.show();
    };

    BattleScreen.prototype.hideCrosshair = function () {
        this._crosshair.hide();
    };

    /**
     * Toggles the visibility of the texts (headers and statistics) on the screen.
     * @returns {undefined}
     */
    BattleScreen.prototype.toggleTextVisibility = function () {
        if (this._bigHeader.isVisible()) {
            this.hideHeaders();
            this.hideStats();
        } else {
            this.showHeaders();
            this.showStats();
        }
    };

    /**
     * Shows the UI (information about controlled spacecraft) component.
     */
    BattleScreen.prototype.showUI = function () {
        this._ui.show();
    };

    /**
     * Shows the given message to the user in an information box.
     * @param {String} message
     */
    BattleScreen.prototype.showMessage = function (message) {
        this._infoBox.updateMessage(message);
        this._infoBox.show();
    };

    /**
     * Updates the big header's content on the screen.
     * @param {String} content
     */
    BattleScreen.prototype.setHeaderContent = function (content) {
        this._bigHeader.setContent(content);
    };

    BattleScreen.prototype.render = function () {
        screens.HTMLScreenWithCanvases.prototype.render.call(this);
        this._stats.setContent(this.getFPS() + "<br/>" + this._sceneCanvasBindings[0].scene.getNumberOfDrawnTriangles());
        var craft = this._level.getPilotedSpacecraft();
        this._ui.setContent(
              craft.getFlightMode() + " flight mode<br/>" +
              "speed: " + craft.getRelativeVelocityMatrix()[13].toFixed() +
              ((craft.getFlightMode() !== "free") ? (" / " + craft._maneuveringComputer._speedTarget.toFixed()) : ""));
    };

    BattleScreen.prototype.startNewBattle = function (levelSourceFilename) {
        document.body.style.cursor = 'wait';
        var loadingStartTime = new Date();
        this.hideStats();
        this.hideUI();
        this.hideCrosshair();
        this._loadingBox.show();
        this.resizeCanvases();
        armada.control().setScreenCenter(
              this.getScreenCanvas("battleCanvas").getCanvasElement().width / 2,
              this.getScreenCanvas("battleCanvas").getCanvasElement().height / 2);

        this._level = new logic.Level();

        var self = this;

        self.updateStatus("loading level information...", 0);
        this._level.requestLoadFromFile(levelSourceFilename, function () {
            self.updateStatus("loading additional configuration...", 5);
            self._level.addRandomShips({falcon: 30, viper: 10, aries: 5, taurus: 10}, 3000, mat.rotation4([0, 0, 1], Math.PI / 2), false, false, true);

            self.updateStatus("building scene...", 10);
            var canvas = self.getScreenCanvas("battleCanvas").getCanvasElement();
            self._battleScene = new budaScene.Scene(
                  0, 0, canvas.width, canvas.height,
                  true, [true, true, true, true],
                  [0, 0, 0, 1], true,
                  armada.graphics().getLODContext(),
                  {
                      enable: armada.graphics().getShadowMapping() && (armada.graphics().getShaderComplexity() === "normal"),
                      shader: armada.resources().getShader("shadowMapping"),
                      textureSize: armada.graphics().getShadowQuality(),
                      ranges: armada.graphics().getShadowRanges(),
                      depthRatio: armada.graphics().getShadowDepthRatio()
                  });
            self._level.addToScene(self._battleScene);

            armada.control().getController("general").setLevel(self._level);
            armada.control().getController("camera").setControlledCamera(self._battleScene.activeCamera);

            self.updateStatus("loading graphical resources...", 15);
            armada.resources().onResourceLoad = function (resourceName, totalResources, loadedResources) {
                self.updateStatus("loaded " + resourceName + ", total progress: " + loadedResources + "/" + totalResources, 20 + (loadedResources / totalResources) * 60);
            };
            var freq = 60;
            armada.resources().executeWhenReady(function () {
                self.updateStatus("initializing WebGL...", 75);
                self.bindSceneToCanvas(self._battleScene, self.getScreenCanvas("battleCanvas"));
                self.updateStatus("", 100);
                Application.log("Game data loaded in " + ((new Date() - loadingStartTime) / 1000).toFixed(3) + " seconds!", 1);
                self._smallHeader.setContent("running an early test of Interstellar Armada, version: " + armada.getVersion());
                armada.control().switchToSpectatorMode();
                self._battleCursor = document.body.style.cursor;
                self.showMessage("Ready!");
                self.getLoadingBox().hide();
                self.showStats();
                self.startRenderLoop(1000 / freq);
            });

            armada.resources().requestResourceLoad();
        });
    };

    /**
     * Defines a database screen object.
     * @class Represents the database screen.
     * @extends screens.HTMLScreenWithCanvases
     * @param {String} name The name by which this screen can be identified.
     * @param {String} source The name of the HTML file where the structure of this
     * screen is defined.
     * @returns {DatabaseScreen}
     */
    function DatabaseScreen(name, source) {
        screens.HTMLScreenWithCanvases.call(this, name, source);

        this._itemName = this.registerSimpleComponent("itemName");
        this._itemType = this.registerSimpleComponent("itemType");
        this._itemDescription = this.registerSimpleComponent("itemDescription");

        this._backButton = this.registerSimpleComponent("backButton");
        this._prevButton = this.registerSimpleComponent("prevButton");
        this._nextButton = this.registerSimpleComponent("nextButton");
        this._loadingBox = this.registerExternalComponent(new components.LoadingBox(name + "_loadingBox", "loadingbox.html", "loadingbox.css"));

        this._scene = null;
        this._item = null;
        this._itemIndex = null;
        this._animationLoop = null;
        this._revealLoop = null;
        this._rotationLoop = null;
        this._solidModel = null;
        this._wireframeModel = null;

        this._mousePos = null;
    }
    ;

    DatabaseScreen.prototype = new screens.HTMLScreenWithCanvases();
    DatabaseScreen.prototype.constructor = DatabaseScreen;

    /**
     * Nulls out the components.
     */
    DatabaseScreen.prototype.removeFromPage = function () {
        screens.HTMLScreenWithCanvases.prototype.removeFromPage.call(this);

        this._itemLength = null;
        this._itemLengthInMeters = null;
        this._itemFront = null;
        this._revealState = null;

        this.stopRevealLoop();
        this.stopRotationLoop();
        this._item = null;
        this._itemIndex = null;
        this._scene = null;
        this._solidModel = null;
        this._wireframeModel = null;

        this._mousePos = null;
    };

    /**
     * Initializes the components of the parent class, then the additional ones for
     * this class.
     */
    DatabaseScreen.prototype._initializeComponents = function () {
        screens.HTMLScreenWithCanvases.prototype._initializeComponents.call(this);

        var self = this;

        this._backButton.getElement().onclick = function () {
            self.stopRevealLoop();
            self.stopRotationLoop();
            if (self.isSuperimposed()) {
                self._game.closeSuperimposedScreen();
            } else {
                self._game.setCurrentScreen('mainMenu');
            }
        };
        this._prevButton.getElement().onclick = function () {
            self.selectPreviousShip();
        };
        this._nextButton.getElement().onclick = function () {
            self.selectNextShip();
        };
    };

    /**
     * Getter for the _loadingBox property.
     * @returns {LoadingBox}
     */
    DatabaseScreen.prototype.getLoadingBox = function () {
        return this._loadingBox;
    };

    /**
     * Uses the loading box to show the status to the user.
     * @param {String} newStatus The status to show on the loading box. If
     * undefined, the status won't be updated.
     * @param {Number} newProgress The new value of the progress bar on the loading
     * box. If undefined, the value won't be updated.
     */
    DatabaseScreen.prototype.updateStatus = function (newStatus, newProgress) {
        if (newStatus !== undefined) {
            this._loadingBox.updateStatus(newStatus);
        }
        if (newProgress !== undefined) {
            this._loadingBox.updateProgress(newProgress);
        }
    };

    DatabaseScreen.prototype.startRevealLoop = function () {
        var prevDate = new Date();
        var self = this;
        this._revealLoop = setInterval(function ()
        {
            var curDate = new Date();
            if (self._revealState < 2.0) {
                self._revealState += (curDate - prevDate) / 1000 / 2;
            } else {
                self.stopRevealLoop();
            }
            prevDate = curDate;
        }, 1000 / 60);
    };

    DatabaseScreen.prototype.startRotationLoop = function () {
        // turn the ship to start the rotation facing the camera
        this._solidModel.setOrientationMatrix(mat.identity4());
        this._solidModel.rotate([0.0, 0.0, 1.0], Math.PI);
        this._solidModel.rotate([1.0, 0.0, 0.0], 60 / 180 * Math.PI);
        this._wireframeModel.setOrientationMatrix(mat.identity4());
        this._wireframeModel.rotate([0.0, 0.0, 1.0], Math.PI);
        this._wireframeModel.rotate([1.0, 0.0, 0.0], 60 / 180 * Math.PI);
        var prevDate = new Date();
        var self = this;
        this._rotationLoop = setInterval(function ()
        {
            var curDate = new Date();
            self._solidModel.rotate(self._item.getVisualModel().getZDirectionVector(), (curDate - prevDate) / 1000 * Math.PI / 2);
            self._wireframeModel.rotate(self._item.getVisualModel().getZDirectionVector(), (curDate - prevDate) / 1000 * Math.PI / 2);
            prevDate = curDate;
        }, 1000 / 60);
    };

    DatabaseScreen.prototype.stopRevealLoop = function () {
        clearInterval(this._revealLoop);
        this._revealLoop = null;
    };

    DatabaseScreen.prototype.stopRotationLoop = function () {
        clearInterval(this._rotationLoop);
        this._rotationLoop = null;
    };

    DatabaseScreen.prototype.show = function () {
        screens.HTMLScreenWithCanvases.prototype.show.call(this);
        this.executeWhenReady(function () {
            this.initializeCanvas();
        });
    };

    DatabaseScreen.prototype.hide = function () {
        screens.HTMLScreenWithCanvases.prototype.hide.call(this);
        this.executeWhenReady(function () {
            this._scene.clearObjects();
            this.render();
        });
    };

    DatabaseScreen.prototype.initializeCanvas = function () {
        this._loadingBox.show();
        this.updateStatus("initializing database...", 0);

        this.resizeCanvas(this._name + "_databaseCanvas");
        var canvas = this.getScreenCanvas("databaseCanvas").getCanvasElement();
        // create a new scene and add a directional light source which will not change
        // while different objects are shown
        this._scene = new budaScene.Scene(
              0, 0, canvas.clientWidth, canvas.clientHeight,
              true, [true, true, true, true],
              [0, 0, 0, 0], true,
              armada.graphics().getLODContext(),
              {
                  enable: armada.graphics().getShadowMapping() && (armada.graphics().getShaderComplexity() === "normal"),
                  shader: armada.resources().getShader("shadowMapping"),
                  textureSize: armada.graphics().getShadowQuality(),
                  ranges: [],
                  depthRatio: armada.graphics().getShadowDepthRatio()
              });
        this._scene.addLightSource(new budaScene.LightSource([1.0, 1.0, 1.0], [0.0, 1.0, 1.0]));

        armada.resources().onResourceLoad = function (resourceName, totalResources, loadedResources) {
            this.updateStatus("loaded " + resourceName + ", total progress: " + loadedResources + "/" + totalResources, 20 + (loadedResources / totalResources) * 60);
        }.bind(this);
        armada.resources().executeWhenReady(function () {
            this.updateStatus("", 100);
            this._loadingBox.hide();
        }.bind(this));

        this.updateStatus("loading graphical resources...", 15);

        this._itemIndex = 0;
        this.loadShip();

        // when the user presses the mouse on the canvas, he can start rotating the model
        // by moving the mouse
        canvas.onmousedown = function (e) {
            if (armada.logic().getDatabaseModelRotation()) {
                this._mousePos = [e.screenX, e.screenY];
                // automatic rotation should stop for the time of manual rotation
                this.stopRotationLoop();
                // the mouse might go out from over the canvas during rotation, so register the
                // move event handler on the document body
                document.body.onmousemove = function (e) {
                    this._solidModel.rotate([0.0, 1.0, 0.0], -(e.screenX - this._mousePos[0]) / 180 * Math.PI);
                    this._solidModel.rotate([1.0, 0.0, 0.0], -(e.screenY - this._mousePos[1]) / 180 * Math.PI);
                    this._wireframeModel.rotate([0.0, 1.0, 0.0], -(e.screenX - this._mousePos[0]) / 180 * Math.PI);
                    this._wireframeModel.rotate([1.0, 0.0, 0.0], -(e.screenY - this._mousePos[1]) / 180 * Math.PI);
                    this._mousePos = [e.screenX, e.screenY];
                }.bind(this);
                // once the user releases the mouse button, the event handlers should be cancelled
                // and the automatic rotation started again
                document.body.onmouseup = function (e) {
                    document.body.onmousemove = null;
                    document.body.onmouseup = null;
                    this.startRotationLoop();
                    e.preventDefault();
                    return false;
                }.bind(this);
            }
            e.preventDefault();
            return false;
        }.bind(this);
    };

    /**
     * Selects and displays the previous spacecraft class from the list on the database
     * screen. Loops around.
     */
    DatabaseScreen.prototype.selectPreviousShip = function () {
        // using % operator does not work with -1, reverted to "if"
        this._itemIndex -= 1;
        if (this._itemIndex === -1) {
            this._itemIndex = armada.logic().getSpacecraftClassesInArray().length - 1;
        }
        this.loadShip();
    };

    /**
     * Selects and displays the next spacecraft class from the list on the database
     * screen. Loops around.
     */
    DatabaseScreen.prototype.selectNextShip = function () {
        this._itemIndex = (this._itemIndex + 1) % armada.logic().getSpacecraftClassesInArray().length;
        this.loadShip();
    };

    /**
     * Load the information and model of the currently selected ship and display
     * them on the page.
     */
    DatabaseScreen.prototype.loadShip = function () {
        // the execution might take a few seconds, and is in the main thread, so
        // better inform the user
        document.body.style.cursor = 'wait';
        // stop the possible ongoing loops that display the previous ship to avoid
        // null reference
        this.stopRevealLoop();
        this.stopRotationLoop();
        this.stopRenderLoop();

        // clear the previous scene graph and render the empty scene to clear the
        // background of the canvas to transparent
        this._scene.clearObjects();
        this.render();

        armada.logic().executeWhenReady(function () {
            // display the data that can be displayed right away, and show loading
            // for the rest
            var shipClass = armada.logic().getSpacecraftClassesInArray()[this._itemIndex];
            this._itemName.setContent(shipClass.fullName);
            this._itemType.setContent(shipClass.spacecraftType.fullName);
            this._itemDescription.setContent("Loading...");

            // create a ship that can be used to add the models (ship with default weapons
            // to the scene
            this._item = new logic.Spacecraft(
                  shipClass,
                  mat.identity4(),
                  mat.identity4(),
                  null,
                  "default"
                  );
            // add the ship to the scene in triangle drawing mode
            this._solidModel = this._item.addToScene(this._scene, armada.graphics().getMaxLoadedLOD(), false, {weapons: true});
            // set the shader to reveal, so that we have a nice reveal animation when a new ship is selected
            this._solidModel.getNode().setShader(armada.graphics().getShadowMapping() ?
                  armada.resources().getShader("shadowMapReveal")
                  : armada.resources().getShader("simpleReveal"));
            // set the necessary uniform functions for the reveal shader
            this._solidModel.setUniformValueFunction("u_revealFront", function () {
                return true;
            });
            this._solidModel.setUniformValueFunction("u_revealStart", function () {
                return this._itemFront - ((this._revealState - 1.0) * this._itemLength * 1.1);
            }, this);
            this._solidModel.setUniformValueFunction("u_revealTransitionLength", function () {
                return this._itemLength / 10;
            }, this);
            // add the ship to the scene in line drawing mode as well
            this._wireframeModel = this._item.addToScene(this._scene, armada.graphics().getMaxLoadedLOD(), true, {weapons: true});
            // set the shader to one colored reveal, so that we have a nice reveal animation when a new ship is selected
            this._wireframeModel.getNode().setShader(armada.resources().getShader("oneColorReveal"));
            // set the necessary uniform functions for the one colored reveal shader
            this._wireframeModel.setUniformValueFunction("u_color", function () {
                return [0.0, 1.0, 0.0, 1.0];
            });
            this._wireframeModel.setUniformValueFunction("u_revealFront", function () {
                return (this._revealState <= 1.0);
            }, this);
            this._wireframeModel.setUniformValueFunction("u_revealStart", function () {
                return this._itemFront - ((this._revealState > 1.0 ? (this._revealState - 1.0) : this._revealState) * this._itemLength * 1.1);
            }, this);
            this._wireframeModel.setUniformValueFunction("u_revealTransitionLength", function () {
                return (this._revealState <= 1.0) ? (this._itemLength / 10) : 0;
            }, this);

            // set the callback for when the potentially needed additional file resources have 
            // been loaded
            armada.resources().executeWhenReady(function () {
                // get the length of the ship based on the length of its model
                this._itemLength = this._item.getVisualModel()._model.getHeight();
                this._itemLengthInMeters = this._item.getVisualModel()._model.getHeightInMeters();
                this._itemFront = this._item.getVisualModel()._model.getMaxY();
                this._itemDescription.setContent(
                      shipClass.description + "<br/>" +
                      "<br/>" +
                      "Length: " + (((this._itemLengthInMeters) < 100) ?
                            (this._itemLengthInMeters).toPrecision(3)
                            : Math.round(this._itemLengthInMeters)) +
                      " m<br/>" +
                      "Weapon slots: " + shipClass.weaponSlots.length + "<br/>" +
                      "Thrusters: " + shipClass.thrusterSlots.length);
                // this will create the GL context if needed or update it with the new
                // data if it already exists
                this.bindSceneToCanvas(this._scene, this.getScreenCanvas("databaseCanvas"));
                // set the camera position so that the whole ship nicely fits into the picture
                this._scene.activeCamera.setPositionMatrix(mat.translation4(0, 0, -this._item.getVisualModel().getScaledSize()));
                if (armada.graphics().getShadowMapping() && (armada.graphics().getShaderComplexity() === "normal")) {
                    this._scene.setShadowMapRanges([
                        0.5 * this._item.getVisualModel().getScaledSize(),
                        this._item.getVisualModel().getScaledSize()
                    ]);
                    this._scene.enableShadowMapping();
                } else {
                    this._scene.disableShadowMapping();
                }

                this._revealState = 0.0;

                var singleRender = true;
                if (armada.logic().getDatabaseModelRotation()) {
                    this.startRotationLoop();
                    singleRender = false;
                }
                if (armada.graphics().getShaderComplexity() === "normal") {
                    this.startRevealLoop();
                    singleRender = false;
                }
                if (singleRender) {
                    this._sceneCanvasBindings[0].canvas.getManagedContext().setup();
                    this.render();
                } else {
                    this.startRenderLoop(1000 / 60);
                }

                document.body.style.cursor = 'default';
            }.bind(this));

            // initiate the loading of additional file resources if they are needed
            armada.resources().requestResourceLoad();
        }.bind(this));
    };

    /**
     * Defines a graphics setting screen object.
     * @class Represents the graphics settings screen.
     * @extends screens.HTMLScreen
     * @param {String} name @see GameScreen
     * @param {String} source @see GameScreen
     * @returns {GraphicsScreen}
     */
    function GraphicsScreen(name, source) {
        screens.HTMLScreen.call(this, name, source);

        this._backButton = this.registerSimpleComponent("backButton");
        this._defaultsButton = this.registerSimpleComponent("defaultsButton");
        this._antialiasingSelector = this.registerExternalComponent(new components.Selector(name + "_aaSelector", "selector.html", "selector.css", "Anti-aliasing:", ["on", "off"]), "settingsDiv");
        this._filteringSelector = this.registerExternalComponent(new components.Selector(name + "_filteringSelector", "selector.html", "selector.css", "Texture filtering:", ["bilinear", "trilinear", "anisotropic"]), "settingsDiv");
        this._lodSelector = this.registerExternalComponent(new components.Selector(name + "_lodSelector", "selector.html", "selector.css", "Model details:", ["very low", "low", "medium", "high", "very high"]), "settingsDiv");
        this._shaderComplexitySelector = this.registerExternalComponent(new components.Selector(name + "_shaderComplexitySelector", "selector.html", "selector.css", "Shaders:", ["normal", "simple"]), "settingsDiv");
        this._shadowMappingSelector = this.registerExternalComponent(new components.Selector(name + "_shadowMappingSelector", "selector.html", "selector.css", "Shadows:", ["on", "off"]), "settingsDiv");
        this._shadowQualitySelector = this.registerExternalComponent(new components.Selector(name + "_shadowQualitySelector", "selector.html", "selector.css", "Shadow quality:", ["low", "medium", "high"]), "settingsDiv");
        this._shadowDistanceSelector = this.registerExternalComponent(new components.Selector(name + "_shadowDistanceSelector", "selector.html", "selector.css", "Shadow distance:", ["very close", "close", "medium", "far", "very far"]), "settingsDiv");
    }
    ;

    GraphicsScreen.prototype = new screens.HTMLScreen();
    GraphicsScreen.prototype.constructor = GraphicsScreen;

    GraphicsScreen.prototype._initializeComponents = function () {
        screens.HTMLScreen.prototype._initializeComponents.call(this);

        var self = this;
        this._backButton.getElement().onclick = function () {
            armada.graphics().setAntialiasing((self._antialiasingSelector.getSelectedValue() === "on"));
            armada.graphics().setFiltering(self._filteringSelector.getSelectedValue());
            armada.graphics().setMaxLOD(self._lodSelector.getSelectedIndex());
            armada.graphics().setShaderComplexity(self._shaderComplexitySelector.getSelectedValue());
            armada.graphics().setShadowMapping((self._shadowMappingSelector.getSelectedValue() === "on"));
            armada.graphics().setShadowQuality((function (v) {
                var mapping = {
                    "low": 1024,
                    "medium": 2048,
                    "high": 4096
                };
                return mapping[v];
            }(self._shadowQualitySelector.getSelectedValue())));
            armada.graphics().setShadowDistance((function (v) {
                var mapping = {
                    "very close": 2,
                    "close": 3,
                    "medium": 4,
                    "far": 5,
                    "very far": 6
                };
                return mapping[v];
            }(self._shadowDistanceSelector.getSelectedValue())));
            if (self.isSuperimposed()) {
                self._game.closeSuperimposedScreen();
            } else {
                self._game.setCurrentScreen('settings');
            }
            return false;
        };
        this._defaultsButton.getElement().onclick = function () {
            armada.graphics().restoreDefaults();
            self.updateValues();
            return false;
        };
        this._shaderComplexitySelector.onChange = function () {
            if (self._shaderComplexitySelector.getSelectedValue() === "normal") {
                self._shadowMappingSelector.show();
                self._shadowMappingSelector.onChange();
            } else {
                self._shadowMappingSelector.hide();
                self._shadowQualitySelector.hide();
                self._shadowDistanceSelector.hide();
            }
        };
        this._shadowMappingSelector.onChange = function () {
            if (self._shadowMappingSelector.getSelectedValue() === "on") {
                if (self._shaderComplexitySelector.getSelectedValue() === "normal") {
                    self._shadowQualitySelector.show();
                    self._shadowDistanceSelector.show();
                }
            } else {
                self._shadowQualitySelector.hide();
                self._shadowDistanceSelector.hide();
            }
        };

        this.updateValues();
    };

    GraphicsScreen.prototype.updateValues = function () {
        var self = this;
        armada.graphics().executeWhenReady(function () {
            self._antialiasingSelector.selectValue((armada.graphics().getAntialiasing() === true) ? "on" : "off");
            self._filteringSelector.selectValue(armada.graphics().getFiltering());
            self._lodSelector.selectValueWithIndex(armada.graphics().getMaxLoadedLOD());
            self._shaderComplexitySelector.selectValue(armada.graphics().getShaderComplexity());
            self._shadowMappingSelector.selectValue((armada.graphics().getShadowMapping() === true) ? "on" : "off");
            self._shadowQualitySelector.selectValue(function (v) {
                switch (v) {
                    case 1024:
                        return "low";
                    case 2048:
                        return "medium";
                    case 4096:
                        return "high";
                    default:
                        return "medium";
                }
            }((armada.graphics().getShadowQuality())));
            self._shadowDistanceSelector.selectValue(function (v) {
                switch (v) {
                    case 2:
                        return "very close";
                    case 3:
                        return "close";
                    case 4:
                        return "medium";
                    case 5:
                        return "far";
                    case 6:
                        return "very far";
                    default:
                        return "medium";
                }
            }((armada.graphics().getShadowDistance())));
        });
    };

    /**
     * Defines a controls screen object.
     * @class Represents the controls screen, where the user can set up the game
     * controls.
     * @extends screens.HTMLScreen
     * @param {String} name @see GameScreen
     * @param {String} source @see GameScreen
     * @returns {ControlsScreen}
     */
    function ControlsScreen(name, source) {
        screens.HTMLScreen.call(this, name, source);
        this._backButton = this.registerSimpleComponent("backButton");
        this._defaultsButton = this.registerSimpleComponent("defaultsButton");
        /**
         * The name of the action currently being set (to get triggered by a new 
         * key). If null, the user is not setting any actions.
         * @name ControlsScreen#_actionUnderSetting
         * @type String
         */
        this._actionUnderSetting = null;
        /**
         * While the user sets a new key, this property tells if shift is pressed
         * down.
         * @name ControlsScreen#_settingShiftState
         * @type Boolean
         */
        this._settingShiftState = null;
        /**
         * While the user sets a new key, this property tells if control is pressed
         * down.
         * @name ControlsScreen#_settingCtrlState
         * @type Boolean
         */
        this._settingCtrlState = null;
        /**
         * While the user sets a new key, this property tells if alt is pressed
         * down.
         * @name ControlsScreen#_settingAltState
         * @type Boolean
         */
        this._settingAltState = null;
    }
    ;

    ControlsScreen.prototype = new screens.HTMLScreen();
    ControlsScreen.prototype.constructor = ControlsScreen;

    /**
     * Refreshes the cell showing the currently set key for the given action in the
     * UI. (call after the key has changed)
     * @param {String} actionName
     */
    ControlsScreen.prototype.refreshKeyForAction = function (actionName) {
        document.getElementById(actionName).innerHTML = armada.control().getInterpreter("keyboard").getControlStringForAction(actionName);
        document.getElementById(actionName).className = "clickable";
    };

    /**
     * Handler for the keydown event to be active while the user is setting a new key
     * for an action. Updates the shift, control and alt states if one of those keys
     * is pressed, so that key combinations such as "ctrl + left" can be set.
     * @param {KeyboardEvent} event
     */
    ControlsScreen.prototype.handleKeyDownWhileSetting = function (event) {
        if (event.keyCode === 16) {
            this._settingShiftState = true;
        }
        if (event.keyCode === 17) {
            this._settingCtrlState = true;
        }
        if (event.keyCode === 18) {
            this._settingAltState = true;
        }
    };

    /**
     * Handler for the keyp event to be active while the user is setting a new key
     * for an action. This actually sets the key to the one that has been released,
     * taking into account the shift, control and alt states as well.
     * @param {KeyboardEvent} event
     */
    ControlsScreen.prototype.handleKeyUpWhileSetting = function (event) {
        // if we released shift, ctrl or alt, update their state
        // (assigning shift, ctrl or alt as a single key to an action is not allowed
        // at the moment, as assigning them to a continuous action would break
        // functionality of other continuous actions that the user would wish to
        // apply simultaneously, since after the press the shift/ctrl/alt state
        // would be different)
        if (event.keyCode === 16) {
            this._settingShiftState = false;
        } else if (event.keyCode === 17) {
            this._settingCtrlState = false;
        } else if (event.keyCode === 18) {
            this._settingAltState = false;
        } else {
            // if it was any other key, respect the shift, ctrl, alt states and set the
            // new key for the action
            var interpreter = armada.control().getInterpreter("keyboard");
            interpreter.setAndStoreKeyBinding(new Control.KeyBinding(
                  this._actionUnderSetting,
                  Control.KeyboardInputInterpreter.prototype.getKeyOfCode(event.keyCode),
                  this._settingShiftState,
                  this._settingCtrlState,
                  this._settingAltState
                  ));
            this.stopKeySetting();
        }
    };

    /**
     * Cancels an ongoing key setting by updating the internal state, refreshing the
     * UI (cancelling highlight and restoring it to show the original key) and cancelling
     * key event handlers.
     */
    ControlsScreen.prototype.stopKeySetting = function () {
        if (this._actionUnderSetting !== null) {
            this.refreshKeyForAction(this._actionUnderSetting);
            this._actionUnderSetting = null;
            document.onkeydown = null;
            document.onkeyup = null;
        }
    };

    /**
     * Starts setting a new key for an action. Highlights the passed element and
     * sets up the key event handlers to update the action represented by this
     * element.
     * @param {Element} tdElement
     */
    ControlsScreen.prototype.startKeySetting = function (tdElement) {
        var actionName = tdElement.getAttribute("id");
        // if we are already in the process of setting this action, just cancel it,
        // so setting an action can be cancelled by clicking on the same cell again
        if (this._actionUnderSetting === actionName) {
            this.stopKeySetting();
            // otherwise cancel if we are in a process of setting another action, and 
            // then start setting this one
        } else {
            this.stopKeySetting();
            this._actionUnderSetting = actionName;
            tdElement.innerHTML = "?";
            tdElement.className = "highlightedItem";
            this._settingShiftState = false;
            this._settingCtrlState = false;
            this._settingAltState = false;
            var self = this;
            document.onkeydown = function (event) {
                self.handleKeyDownWhileSetting(event);
            };
            document.onkeyup = function (event) {
                self.handleKeyUpWhileSetting(event);
            };
        }
    };

    /**
     * Initializes the buttons and adds the table showing the current control settings.
     */
    ControlsScreen.prototype._initializeComponents = function () {
        screens.HTMLScreen.prototype._initializeComponents.call(this);

        var self = this;
        this._backButton.getElement().onclick = function () {
            self.stopKeySetting();
            if (self._game.getCurrentScreen().isSuperimposed()) {
                self._game.closeSuperimposedScreen();
            } else {
                self._game.setCurrentScreen('settings');
            }
            return false;
        };
        this._defaultsButton.getElement().onclick = function () {
            self.stopKeySetting();
            armada.control().restoreDefaults();
            self.generateTables();
            return false;
        };

        this.generateTables();
    };

    /**
     * Adds the table showing available actions and their assigned keys as well as
     * sets up a click handler for the cells showing the keys to initiate a change
     * of that key binding.
     */
    ControlsScreen.prototype.generateTables = function () {
        var self = this;
        armada.control().executeWhenReady(function () {
            var tablesContainer = document.getElementById(self._name + "_tablesContainer");
            tablesContainer.innerHTML = "";
            var gameControllers = armada.control().getControllers();
            for (var i = 0; i < gameControllers.length; i++) {
                var h2Element = document.createElement("h2");
                h2Element.innerHTML = gameControllers[i].getType() + " controls";
                tablesContainer.appendChild(h2Element);
                var tableElement = document.createElement("table");
                tableElement.className = "horizontallyCentered outerContainer";
                var theadElement = document.createElement("thead");
                for (var j = 0, n = armada.control().getInputInterpreters().length; j < n; j++) {
                    var thElement = document.createElement("th");
                    thElement.innerHTML = armada.control().getInputInterpreters()[j].getDeviceName();
                    theadElement.appendChild(thElement);
                }
                theadElement.innerHTML += "<th>Action</th>";
                var tbodyElement = document.createElement("tbody");
                var actions = gameControllers[i].getActions();
                for (j = 0; j < actions.length; j++) {
                    var trElement = document.createElement("tr");
                    for (var k = 0, n = armada.control().getInputInterpreters().length; k < n; k++) {
                        var td1Element = document.createElement("td");
                        if (armada.control().getInputInterpreters()[k].getDeviceName() === "Keyboard") {
                            td1Element.setAttribute("id", actions[j].getName());
                            td1Element.className = "clickable";
                            td1Element.onclick = function () {
                                self.startKeySetting(this);
                            };
                        }
                        td1Element.innerHTML = armada.control().getInputInterpreters()[k].getControlStringForAction(actions[j].getName());
                        trElement.appendChild(td1Element);
                    }
                    var td2Element = document.createElement("td");
                    td2Element.innerHTML = actions[j].getDescription();
                    trElement.appendChild(td2Element);
                    tbodyElement.appendChild(trElement);
                }
                tableElement.appendChild(theadElement);
                tableElement.appendChild(tbodyElement);
                tablesContainer.appendChild(tableElement);
            }
        });
    };

    /**
     * Creates an about screen object.
     * @class A class to represent the "About" screen in the game. Describes the
     * dynamic behaviour on that screen.
     * @param {String} name See {@link GameScreen}
     * @param {String} source See {@link GameScreen}
     * @returns {AboutScreen}
     */
    function AboutScreen(name, source) {
        screens.HTMLScreen.call(this, name, source);

        this._backButton = this.registerSimpleComponent("backButton");
        /**
         * @name AboutScreen#_versionParagraph
         * @type SimpleComponent
         */
        this._versionParagraph = this.registerSimpleComponent("versionParagraph");
    }

    AboutScreen.prototype = new screens.HTMLScreen();
    AboutScreen.prototype.constructor = AboutScreen;

    AboutScreen.prototype._initializeComponents = function () {
        screens.HTMLScreen.prototype._initializeComponents.call(this);

        this._versionParagraph.setContent("Application version: " + armada.getVersion());

        var self = this;
        this._backButton.getElement().onclick = function () {
            if (self._game.getCurrentScreen().isSuperimposed()) {
                self._game.closeSuperimposedScreen();
            } else {
                self._game.setCurrentScreen('mainMenu');
            }
            return false;
        };
    };

    // -------------------------------------------------------------------------
    // The public interface of the module
    return {
        BattleScreen: BattleScreen,
        DatabaseScreen: DatabaseScreen,
        GraphicsScreen: GraphicsScreen,
        ControlsScreen: ControlsScreen,
        AboutScreen: AboutScreen
    };

});