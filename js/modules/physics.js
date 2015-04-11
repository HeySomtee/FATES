"use strict";

/**
 * @fileOverview This file implements the simple newtonian physics engine of the
 * Interstellar Armada program.
 * @author <a href="mailto:nkrisztian89@gmail.com">Krisztián Nagy</a>
 * @version 0.1
 */

/**********************************************************************
 Copyright 2014 Krisztián Nagy
 
 This file is part of Interstellar Armada.
 
 Interstellar Armada is free software: you can redistribute it and/or modify
 it under the terms of the GNU General Public License as published by
 the Free Software Foundation, either version 3 of the License, or
 (at your option) any later version.
 
 Interstellar Armada is distributed in the hope that it will be useful,
 but WITHOUT ANY WARRANTY; without even the implied warranty of
 MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 GNU General Public License for more details.
 
 You should have received a copy of the GNU General Public License
 along with Interstellar Armada.  If not, see <http://www.gnu.org/licenses/>.
 ***********************************************************************/

Application.createModule({name: "Physics",
    dependencies: [
        {script: "matrices.js"}]}, function () {
    /**
     * @class Represents a force affecting a physical object, causing it to 
     * accelerate at a constant rate in the direction of the force.
     * @param {String} id Can be used to identify continuous forces so that their
     * properties can be subsequently renewed.
     * @param {Number} strength The strength of the force in newtons.
     * @param {Number[]} direction The vector describing the direction in which
     * the force creates the acceleration.
     * @param {Number} duration The duration while the force is still in effect, 
     * given in milliseconds.
     */
    function Force(id, strength, direction, duration) {
        /**
         * Can be used to identify and update a force that changes over time.
         * @name Force#_id
         * @type String
         */
        this._id = id;
        /**
         * Magnitude of the force, in newtons.
         * @name Force#_strength
         * @type Number
         */
        this._strength = strength;
        /**
         * Attack direction vector of the force. Always normalized.
         * @name Force#_direction
         * @type Number[3]
         */
        this._direction = Vec.normal3(direction);
        /**
         * For how much more time is this force in effect, in milliseconds.
         * @name Force#_duration
         * @type Number
         */
        this._duration = duration;
    }
    // #########################################################################
    // direct getters and setters
    /**
     * Returns the force ID.
     * @returns {String}
     */
    Force.prototype.getID = function () {
        return this._id;
    };
    // #########################################################################
    // methods
    /**
     * Updates the properties of the force to the passed ones.
     * @param {Number} strength
     * @param {Number[3]} direction
     * @param {Number} duration
     */
    Force.prototype.renew = function (strength, direction, duration) {
        this._strength = strength;
        this._direction = Vec.normal3(direction);
        this._duration = duration;
    };
    /**
     * Returns the duration for how long this force have been exerted if the
     * given amount of time has passed since the last check. Also decreases the
     * remaining duration of the force.
     * @param {Number} dt Elapsed time in milliseconds.
     * @returns {Number} The duration of the exertion of this force in 
     * milliseconds.
     */
    Force.prototype.getExertionDuration = function (dt) {
        if (this._duration > 0.1) {
            var t = Math.min(this._duration, dt);
            this._duration -= dt;
            return t;
        } else {
            return 0;
        }
    };
    /**
     * Returns the vector corresponding to the acceleration this force causes on 
     * an object that has the passed mass.
     * @param {Number} mass The mass of the object to accelerate, in kg.
     * @returns {Number[3]} The acceleration vector, in m/s^2.
     */
    Force.prototype.getAccelerationVector = function (mass) {
        return Vec.scaled3(this._direction, this._strength / mass);
    };
    // #########################################################################
    /**
     * @class Represents a torque affecting a physical object, causing it to 
     * accelerate its spinning around the axis of the torque at a constant rate.
     * @param {String} id Can be used to identify continuous torques so that their
     * properties can be subsequently renewed.
     * @param {Number} strength The strength of the torque in kg*rad/s^2.
     * @param {Number[]} axis The vector describing the axis of spinning.
     * @param {Number} duration The duration while the torque is still in effect,
     * given in milliseconds.
     */
    function Torque(id, strength, axis, duration) {
        /**
         * Can be used to identify and update a torque that changes over time.
         * @name Torque#_id
         * @type String
         */
        this._id = id;
        /**
         * Magnitude of the torque, in kg*rad/s^2.
         * @name Torque#_strength
         * @type Number
         */
        this._strength = strength;
        /**
         * Axis of the spinning which this torque accelerates. Always normalized.
         * @name Torque#_axis
         * @type Number[3]
         */
        this._axis = Vec.normal3(axis);
        /**
         * For how much more time is this torque in effect, in milliseconds.
         * @name Torque#_duration
         * @type Number
         */
        this._duration = duration;
    }
    // #########################################################################
    // direct getters and setters
    /**
     * Returns the torque ID.
     * @returns {String}
     */
    Torque.prototype.getID = function () {
        return this._id;
    };
    // #########################################################################
    // methods
    /**
     * Updates the properties of the torque to the passed ones.
     * @param {Number} strength
     * @param {Number[3]} axis
     * @param {Number} duration
     */
    Torque.prototype.renew = function (strength, axis, duration) {
        this._strength = strength;
        this._axis = axis;
        this._duration = duration;
    };
    /**
     * Returns the duration for how long this torque have been exerted if the
     * given amount of time has passed since the last check. Also decreases the
     * remaining duration of the torque.
     * @param {Number} dt Elapsed time in milliseconds.
     * @returns {Number} The duration of the exertion of this torque in 
     * milliseconds.
     */
    Torque.prototype.getExertionDuration = function (dt) {
        if (this._duration > 0.1) {
            var t = Math.min(this._duration, dt);
            this._duration -= dt;
            return t;
        } else {
            return 0;
        }
    };
    /**
     * Returns the rotation matrix corresponding to the angular acceleration 
     * this torque causes on an object that has the passed mass if exerted for
     * the given time.
     * @param {Number} mass The mass of the object to accelerate, in kg.
     * @param {Number} t The time of exertion, in seconds.
     * @returns {Float32Array} A 4x4 rotation matrix.
     */
    Torque.prototype.getAngularAccelerationMatrixOverTime = function (mass, t) {
        // in reality, the shape of the object should be taken into account,
        // for simplicity, the mass is taken as the only coefficient
        return Mat.rotation4(this._axis, this._strength / mass * t);
    };
    // #########################################################################
    /**
     * @class Represents a physical body with a box shape in space.
     * @param {Float32Array} positionMatrix The 4x4 translation matrix describing
     * the initial position of the body (relative to its parent).
     * @param {Float32Array} orientationMatrix The 4x4 rotation matrix describing
     * the initial orientation of the body (relative to its parent).
     * @param {Number[3]} dimensions The size of the box this body represents
     * along the 3 axes, in relative (unoriented) space.
     * @returns {Body}
     */
    function Body(positionMatrix, orientationMatrix, dimensions) {
        /**
         * The 4x4 translation matrix describing the position of the body 
         * (relative to its parent).
         * @name Body#_positionMatrix
         * @type Float32Array
         */
        this._positionMatrix = positionMatrix;
        /**
         * The 4x4 rotation matrix describing the orientation of the body 
         * (relative to its parent).
         * @name Body#_orientationMatrix
         * @type Float32Array
         */
        this._orientationMatrix = orientationMatrix;
        /**
         * The cached inverse of the model matrix of the body.
         * @name Body#_modelMatrixInverse
         * @type Float32Array
         */
        this._modelMatrixInverse = null;
        /**
         * The size of the box this body represents along the X axis, in relative 
         * (unoriented) space.
         * @name Body#_width
         * @type Number
         */
        this._width = dimensions[0];
        /**
         * The size of the box this body represents along the Y axis, in relative 
         * (unoriented) space.
         * @name Body#_height
         * @type Number
         */
        this._height = dimensions[1];
        /**
         * The size of the box this body represents along the Z axis, in relative 
         * (unoriented) space.
         * @name Body#_depth
         * @type Number
         */
        this._depth = dimensions[2];
    }
    // #########################################################################
    // direct getters and setters
    /**
     * Return the 4x4 translation matrix describing the position of the body 
     * (relative to its parent).
     * @returns {Float32Array}
     */
    Body.prototype.getPositionMatrix = function () {
        return this._positionMatrix;
    };
    /**
     * Return the 4x4 rotation matrix describing the orientation of the body 
     * (relative to its parent).
     * @returns {Float32Array}
     */
    Body.prototype.getOrientationMatrix = function () {
        return this._orientationMatrix;
    };
    /**
     * Returns the size of the box this body represents along the X axis, in 
     * relative (unoriented) space.
     * @returns {Number}
     */
    Body.prototype.getWidth = function () {
        return this._width;
    };
    /**
     * Returns the size of the box this body represents along the Y axis, in 
     * relative (unoriented) space.
     * @returns {Number}
     */
    Body.prototype.getHeight = function () {
        return this._height;
    };
    /**
     * Returns the size of the box this body represents along the Z axis, in 
     * relative (unoriented) space.
     * @returns {Number}
     */
    Body.prototype.getDepth = function () {
        return this._depth;
    };
    // #########################################################################
    // indirect getters and setters
    /**
     * Returns the inverse of the model matrix (the matrix representing both the
     * position and orientation of the body)
     * @returns {Float32Array} A 4x4 transformation matrix.
     */
    Body.prototype.getModelMatrixInverse = function () {
        this._modelMatrixInverse = this._modelMatrixInverse || Mat.mul4(Mat.inverseOfTranslation4(this._positionMatrix), Mat.inverseOfRotation4(this._orientationMatrix));
        return this._modelMatrixInverse;
    };
    /**
     * Returns the half of the width, height and depth of the body in an array.
     * @returns {Number[3]}
     */
    Body.prototype.getHalfDimensions = function () {
        return [this._width * 0.5, this._height * 0.5, this._depth * 0.5];
    };
    // #########################################################################
    // methods
    /**
     * Checks whether a particular point in space is located inside this body.
     * @param {Number[3]} relativePositionVector A 3D vector describing the
     * position of the point to check in the same space the position and
     * orientation of this body is stored (model space of the parent)
     * @returns {Boolean} Whether the point is inside or not.
     */
    Body.prototype.checkHit = function (relativePositionVector) {
        relativePositionVector = Vec.mulVec4Mat4(relativePositionVector, this.getModelMatrixInverse());
        return (
                (relativePositionVector[0] >= -this._width * 0.5) && (relativePositionVector[0] <= this._width * 0.5) &&
                (relativePositionVector[1] >= -this._height * 0.5) && (relativePositionVector[1] <= this._height * 0.5) &&
                (relativePositionVector[2] >= -this._depth * 0.5) && (relativePositionVector[2] <= this._depth * 0.5));
    };
    // #########################################################################
    /**
     * @class The basic entity for all physical simulations. Can have physical
     * properties and interact with other objects.
     * @param {Number} mass The mass of the physical object in kg.
     * @param {Float32Array} positionMatrix The 4x4 translation matrix describing
     * the initial position of the object. (in meters)
     * @param {Float32Array} orientationMatrix The 4x4 rotation matrix describing
     * the initial orientation of the object.
     * @param {Float32Array} scalingMatrix The 4x4 scaling matrix describing the
     * initial scaling of the object.
     * @param {Float32Array} initialVelocityMatrix The 4x4 translation matrix 
     * describing the initial velocity of the object. (in m/s)
     * @param {Body[]} [bodies] The array of bodies this object is comprised of.
     * @returns {PhysicalObject}
     */
    function PhysicalObject(mass, positionMatrix, orientationMatrix, scalingMatrix, initialVelocityMatrix, bodies) {
        /**
         * The mass in kilograms.
         * @name PhysicalObject#_mass
         * @type Number
         */
        this._mass = mass;
        /**
         * The 4x4 translation matrix describing the position of the object.
         * (meters, world space)
         * @name PhysicalObject#_positionMatrix
         * @type Float32Array
         */
        this._positionMatrix = positionMatrix;
        /**
         * The 4x4 rotation matrix describing the orientation of the object.
         * @name PhysicalObject#_orientationMatrix
         * @type Float32Array
         */
        this._orientationMatrix = orientationMatrix;
        /**
         * The 4x4 scaling matrix describing the scale of the object.
         * @name PhysicalObject#_scalingMatrix
         * @type Float32Array
         */
        this._scalingMatrix = scalingMatrix;
        /**
         * The cached inverse of the orientation matrix.
         * @name Body#_rotationMatrixInverse
         * @type Float32Array
         */
        this._rotationMatrixInverse = null;
        /**
         * The cached inverse of the model (position + orientation + scaling) 
         * matrix.
         * @name Body#_modelMatrixInverse
         * @type Float32Array
         */
        this._modelMatrixInverse = null;
        /**
         * The 4x4 translation matrix describing the velocity of the object.
         * (m/s)
         * @name PhysicalObject#_velocityMatrix
         * @type Float32Array
         */
        this._velocityMatrix = initialVelocityMatrix;
        /**
         * The 4x4 rotation matrix describing the rotation the current angular
         * velocity of the object causes over 5 milliseconds. (because rotation
         * is performed in steps as matrix rotation cannot be interpolated)
         * @name PhysicalObject#_angularVelocityMatrix
         * @type Float32Array
         */
        this._angularVelocityMatrix = Mat.identity4();
        /**
         * The list of forces affecting this object.
         * @name PhysicalObject#_forces
         * @type Force[]
         */
        this._forces = new Array();
        /**
         * The list of torques affecting this object.
         * @name PhysicalObject#_torques
         * @type Torque[]
         */
        this._torques = new Array();
        /**
         * The list of bodies the structure of this object is comprised of. (for
         * hit/collision check)
         * @name PhysicalObject#_bodies
         * @type Body[]
         */
        this._bodies = bodies || new Array();
        /**
         * The cached size of the whole srtucture (the distance between the
         * center of the object and the farthest point of its bodies)
         * @name PhysicalObject#_bodySize
         * @type Number
         */
        this._bodySize = -1;
        this._calculateBodySize();
    }
    // #########################################################################
    // direct getters and setters
    /**
     * The mass of the physical object in kilograms.
     * @returns {Number}
     */
    PhysicalObject.prototype.getMass = function () {
        return this._mass;
    };
    /**
     * Returns the 4x4 translation matrix describing the position of the object.
     * (meters, world space)
     * @returns {Float32Array}
     */
    PhysicalObject.prototype.getPositionMatrix = function () {
        return this._positionMatrix;
    };
    /**
     * Returns the 4x4 rotation matrix describing the orientation of the object.
     * @returns {Float32Array}
     */
    PhysicalObject.prototype.getOrientationMatrix = function () {
        return this._orientationMatrix;
    };
    /**
     * Returns the 4x4 scaling matrix describing the scale of the object.
     * @returns {Float32Array}
     */
    PhysicalObject.prototype.getScalingMatrix = function () {
        return this._scalingMatrix;
    };
    /**
     * Returns the 4x4 translation matrix describing the velocity of the object.
     * (in m/s)
     * @returns {Float32Array}
     */
    PhysicalObject.prototype.getVelocityMatrix = function () {
        return this._velocityMatrix;
    };
    /**
     * Returns the 4x4 rotation matrix describing the rotation the current angular
     * velocity of the object causes over 5 milliseconds.
     * @returns {Float32Array}
     */
    PhysicalObject.prototype.getAngularVelocityMatrix = function () {
        return this._angularVelocityMatrix;
    };
    /**
     * Adds a force that will affect this object from now on.
     * @param {Force} force
     */
    PhysicalObject.prototype.addForce = function (force) {
        this._forces.push(force);
    };
    /**
     * Adds a torque that will affect this object from now on.
     * @param {Torque} torque
     */
    PhysicalObject.prototype.addTorque = function (torque) {
        this._torques.push(torque);
    };
    // #########################################################################
    // indirect getters and setters
    /**
     * Sets the position for this object to the passed matrix.
     * @param {Float32Array} value A 4x4 translation matrix.
     */
    PhysicalObject.prototype.setPositionMatrix = function (value) {
        this._positionMatrix = value;
        this._modelMatrixInverse = null;
    };
    /**
     * Sets the orientation for this object to the passed matrix.
     * @param {Float32Array} value A 4x4 rotation matrix.
     */
    PhysicalObject.prototype.setOrientationMatrix = function (value) {
        this._orientationMatrix = value;
        this._rotationMatrixInverse = null;
        this._modelMatrixInverse = null;
    };
    /**
     * Returns the inverse of the rotation matrix and stores it in a cache to
     * make sure it is only calculated again if the rotation matrix changes.
     * @returns {Float32Array}
     */
    PhysicalObject.prototype.getRotationMatrixInverse = function () {
        this._rotationMatrixInverse = this._rotationMatrixInverse || Mat.inverseOfRotation4(this._orientationMatrix);
        return this._rotationMatrixInverse;
    };
    /**
     * Returns the inverse of the model matrix and stores it in a cache to
     * make sure it is only calculated again if the model matrix changes.
     * @returns {Float32Array}
     */
    PhysicalObject.prototype.getModelMatrixInverse = function () {
        this._modelMatrixInverse = this._modelMatrixInverse || Mat.mul4(
                Mat.mul4(
                        Mat.inverseOfTranslation4(this._positionMatrix),
                        this.getRotationMatrixInverse()),
                Mat.inverseOfScaling4(this._scalingMatrix));
        return this._modelMatrixInverse;
    };
    // #########################################################################
    // methods
    /**
     * Checks the forces for one with the given ID, if it exists, renews its
     * properties, if it does not, adds a new force with the given parameters. It
     * will renew the first force found with the given ID, if more than one exists.
     * @param {String} forceID The ID of the force to look for
     * @param {number} strength The new strength of the force in newtons.
     * @param {number[]} direction The vector describing the new direction of the force.
     * @param {number} duration The force will either created with, or renewed to
     * last for this duration.
     */
    PhysicalObject.prototype.addOrRenewForce = function (forceID, strength, direction, duration) {
        var i;
        var found = false;
        for (i = 0; i < this._forces.length; i++) {
            if (this._forces[i].getID() === forceID) {
                this._forces[i].renew(strength, direction, duration);
                found = true;
                break;
            }
        }
        if (found === false) {
            this.addForce(new Force(forceID, strength, direction, duration));
        }
    };
    /**
     * Checks the torques for one with the given ID, if it exists, renews its
     * properties, if it does not, adds a new torque with the given parameters. It
     * will renew the first torque found with the given ID, if more than one exists.
     * @param {String} torqueID The ID of the torque to look for
     * @param {number} strength The strength of the torque.
     * @param {number[]} axis The vector describing the axis of the torque.
     * @param {number} duration The torque will either created with, or renewed to
     * last for this duration.
     */
    PhysicalObject.prototype.addOrRenewTorque = function (torqueID, strength, axis, duration) {
        var i;
        var found = false;
        for (i = 0; i < this._torques.length; i++) {
            if (this._torques[i].getID() === torqueID) {
                this._torques[i].renew(strength, axis, duration);
                found = true;
                break;
            }
        }
        if (found === false) {
            this.addTorque(new Torque(torqueID, strength, axis, duration));
        }
    };
    /**
     * Calculates the size of the structure of this physical object and stores 
     * it in a cache to speed up hit checks.
     */
    PhysicalObject.prototype._calculateBodySize = function () {
        this._bodySize = 0;
        var bodyPos;
        for (var i = 0; i < this._bodies.length; i++) {
            bodyPos = Mat.translationVector3(this._bodies[i].getPositionMatrix());
            var halfDim = Vec.mulVec3Mat3(this._bodies[i].getHalfDimensions(), Mat.matrix3from4(Mat.mul4(
                    this._orientationMatrix,
                    this._bodies[i].getOrientationMatrix())));
            this._bodySize = Math.max(this._bodySize, Vec.length3(Vec.add3(bodyPos, halfDim)));
            this._bodySize = Math.max(this._bodySize, Vec.length3(Vec.add3(bodyPos, [halfDim[0], halfDim[1], -halfDim[2]])));
            this._bodySize = Math.max(this._bodySize, Vec.length3(Vec.add3(bodyPos, [halfDim[0], -halfDim[1], halfDim[2]])));
            this._bodySize = Math.max(this._bodySize, Vec.length3(Vec.add3(bodyPos, [halfDim[0], -halfDim[1], -halfDim[2]])));
            this._bodySize = Math.max(this._bodySize, Vec.length3(Vec.add3(bodyPos, [-halfDim[0], halfDim[1], halfDim[2]])));
            this._bodySize = Math.max(this._bodySize, Vec.length3(Vec.add3(bodyPos, [-halfDim[0], halfDim[1], -halfDim[2]])));
            this._bodySize = Math.max(this._bodySize, Vec.length3(Vec.add3(bodyPos, [-halfDim[0], -halfDim[1], halfDim[2]])));
            this._bodySize = Math.max(this._bodySize, Vec.length3(Vec.add3(bodyPos, [-halfDim[0], -halfDim[1], -halfDim[2]])));
        }
    };
    /**
     * Checks whether a particular point in space is located inside the structure
     * of this object.
     * @param {Number[3]} positionVector A 3D vector describing the
     * position of the point in worlds space. (in meters)
     * @returns {Boolean} Whether the point is inside the structure or not.
     */
    PhysicalObject.prototype.checkHit = function (positionVector) {
        var result = false;
        // make the vector 4D for the matrix multiplication
        positionVector.push(1);
        // first, preliminary check based on position relative to the whole object
        var relativePos = Vec.mulVec4Mat4(positionVector, this.getModelMatrixInverse());
        if ((Math.abs(relativePos[0]) < this._bodySize) && (Math.abs(relativePos[1]) < this._bodySize) && (Math.abs(relativePos[2]) < this._bodySize)) {
            // if it is close enough to be hitting one of the bodies, check them
            for (var i = 0; (result === false) && (i < this._bodies.length); i++) {
                result = this._bodies[i].checkHit(relativePos);
            }
        }
        return result;
    };
    /**
     * Ensures that the orientation and angular velocity matrices are orthogonal,
     * compensating for floating point inaccuracies.
     */
    PhysicalObject.prototype._correctMatrices = function () {
        this.setOrientationMatrix(Mat.correctedOrthogonal4(this._orientationMatrix));
        this._angularVelocityMatrix = Mat.correctedOrthogonal4(this._angularVelocityMatrix);
    };
    /**
     * Performs the physics calculations for the object based on the forces and 
     * torques that are affecting it, updating its position and orientation.
     * @param {Number} dt The elapsed time since the last simulation step, in
     * milliseconds.
     */
    PhysicalObject.prototype.simulate = function (dt) {
        var i, a, t;
        if (dt > 0) {
            // first calculate the movement that happened in the past dt
            // milliseconds as a result of the velocity sampled in the previous step
            // the velocity matrix is in m/s
            this.setPositionMatrix(Mat.mul4(this._positionMatrix, Mat.translation4v(Vec.scaled3(Mat.translationVector3(this._velocityMatrix), dt / 1000))));
            // calculate the movement that happened as a result of the acceleration
            // the affecting forces caused since the previous step
            // (s=1/2*a*t^2)
            var accelerationMatrix = Mat.identity4();
            for (i = 0; i < this._forces.length; i++) {
                t = this._forces[i].getExertionDuration(dt) / 1000; // t is in seconds
                if (t > 0) {
                    a = this._forces[i].getAccelerationVector(this._mass);
                    this.setPositionMatrix(Mat.mul4(
                            this._positionMatrix,
                            Mat.translation4v(Vec.scaled3(a, 1 / 2 * t * t))));
                    // calculate the caused acceleration to update the velocity matrix
                    accelerationMatrix = Mat.mul4(
                            accelerationMatrix,
                            Mat.translation4v(Vec.scaled3(a, t)));
                }
            }
            // update velocity matrix
            this._velocityMatrix = Mat.mul4(this._velocityMatrix, accelerationMatrix);
            // the same process with rotation and torques
            // the angular velocity matrix represents the rotation that happens
            // during the course of 5 milliseconds (since rotation cannot be
            // interpolated easily, for that quaternions should be used)
            for (i = 0; i + 2 < dt; i += 5) {
                this.setOrientationMatrix(Mat.mul4(this._orientationMatrix, this._angularVelocityMatrix));
            }
            // calculate the rotation that happened as a result of the angular
            // acceleration the affecting torques caused since the previous step
            var angularAccMatrix = Mat.identity4();
            for (i = 0; i < this._torques.length; i++) {
                t = this._torques[i].getExertionDuration(dt) / 1000; // t is in seconds
                if (t > 0) {
                    this.setOrientationMatrix(Mat.mul4(
                            this._orientationMatrix,
                            this._torques[i].getAngularAccelerationMatrixOverTime(this._mass, 1 / 2 * t * t)));
                    // angular acceleration matrix stores angular acceleration for 5ms
                    angularAccMatrix = Mat.mul4(
                            angularAccMatrix,
                            this._torques[i].getAngularAccelerationMatrixOverTime(this._mass, t / 200));
                }
            }
            // update angular velocity matrix
            this._angularVelocityMatrix = Mat.mul4(this._angularVelocityMatrix, angularAccMatrix);
            // correct matrix inaccuracies and close to zero values resulting from
            // floating point operations
            this._velocityMatrix = Mat.straightened(this._velocityMatrix, 0.0001);
            this._angularVelocityMatrix = Mat.straightened(this._angularVelocityMatrix, 0.00002);
            this._correctMatrices();
        }
    };
    // -------------------------------------------------------------------------
    // The public interface of the module
    return {
        Body: Body,
        Force: Force,
        PhysicalObject: PhysicalObject
    };
});