// shader similar to simple.vert, but adding also passing position in model space

precision mediump float;

uniform mat4 u_modelMatrix;
uniform mat4 u_cameraMatrix;
uniform mat4 u_projMatrix;
uniform mat3 u_normalMatrix;

attribute vec3 a_position;
attribute vec2 a_texCoord;
attribute vec3 a_normal;
attribute vec4 a_color;
attribute float a_luminosity;
attribute float a_shininess;
attribute vec4 a_index;

varying vec3 v_position;	
varying vec2 v_texCoord;
varying vec3 v_normal;
varying vec4 v_color;
varying float v_luminosity;
varying float v_shininess;
varying vec4 v_index;

// the coordinates of this vertex in world space
varying vec4 v_worldPos;
// the coordinates of this vertex in model space
varying vec4 v_modelPos;

void main() {
	gl_Position = u_projMatrix * u_cameraMatrix * u_modelMatrix * vec4(a_position,1.0);

        v_position = a_position;
	v_texCoord = a_texCoord;
	v_normal = normalize(u_normalMatrix * a_normal);
	v_color = a_color;
	v_luminosity = a_luminosity;
	v_shininess = a_shininess;
        v_index = a_index;
	
	v_worldPos = u_modelMatrix * vec4(a_position,1.0);
	v_modelPos = vec4(a_position,1.0);
}