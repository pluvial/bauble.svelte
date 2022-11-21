import { mat3, vec3 } from 'gl-matrix';
import { clamp, TAU } from './util';

const baseCameraDistance = 512;

function assert<T>(value: T): NonNullable<T> {
	if (value === null || value === undefined) throw new Error(`Assertion failed: ${value} value`);
	return value;
}

function rotateXY(target: mat3, x: number, y: number) {
	const sx = Math.sin(x);
	const sy = Math.sin(y);
	const cx = Math.cos(x);
	const cy = Math.cos(y);

	mat3.set(target, cx, 0.0, -sx, sx * sy, cy, cx * sy, sx * cy, -sy, cx * cy);
}

const vertexSource = `#version 300 es
in vec4 position;
void main() {
  gl_Position = position;
}
`;

declare global {
	interface ErrorConstructor {
		new (message?: string, options?: { cause?: string }): Error;
		(message?: string, options?: { cause?: string }): Error;
	}
}

function compileShader(gl: WebGLRenderingContext, type: number, source: string) {
	const shader = assert(gl.createShader(type));
	gl.shaderSource(shader, source);
	gl.compileShader(shader);

	if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
		const info = gl.getShaderInfoLog(shader);
		gl.deleteShader(shader);
		throw new Error('failed to compile shader', { cause: info });
	}

	return shader;
}

export default class Renderer {
	private gl: WebGLRenderingContext;
	private program: WebGLProgram;
	private currentFragmentShader: WebGLShader | null = null;
	private currentFragmentShaderSource: string | null = null;
	private _positionLocation: number | null = null;
	private vertexBuffer: WebGLBuffer;
	private vertexData: Float32Array;

	private cameraDirty = true;
	private cameraMatrix: mat3 = mat3.create();
	private cameraOrigin: vec3 = vec3.create();

	// TODO: the perspective is actually calculated
	// in the shader, not here, so this is actually a
	// "perspective XY" view
	private orthogonalXY: mat3 = mat3.create();
	private orthogonalXZ: mat3 = mat3.create();
	private orthogonalZY: mat3 = mat3.create();

	constructor(
		canvas: HTMLCanvasElement,
		private time: () => number, // TODO: give this a unique type
		private renderType: () => number, // TODO: give this a type
		private rotation: () => { x: number; y: number },
		private origin: () => { x: number; y: number; z: number },
		private zoom: () => number, // TODO: give this a unique type
		private quadView: () => boolean,
		private quadSplitPoint: () => { x: number; y: number },
		private resolution: () => { width: number; height: number }
	) {
		rotateXY(this.orthogonalXY, 0, 0);
		rotateXY(this.orthogonalZY, -0.5 * Math.PI, 0);
		rotateXY(this.orthogonalXZ, 0, -0.5 * Math.PI);

		const gl = canvas.getContext('webgl2', { antialias: false });
		if (!gl) {
			throw new Error('failed to create webgl2 context');
		}

		const program = assert(gl.createProgram());
		gl.attachShader(program, compileShader(gl, gl.VERTEX_SHADER, vertexSource));

		const left = -0.5 * canvas.width;
		const right = 0.5 * canvas.width;
		const top = 0.5 * canvas.height;
		const bottom = -0.5 * canvas.height;

		const vertexBuffer = assert(gl.createBuffer());
		const vertexData = new Float32Array(6 * 3);
		vertexData[0] = left;
		vertexData[1] = top;
		vertexData[2] = 0;
		vertexData[3] = right;
		vertexData[4] = top;
		vertexData[5] = 0;
		vertexData[6] = right;
		vertexData[7] = bottom;
		vertexData[8] = 0;
		vertexData[9] = right;
		vertexData[10] = bottom;
		vertexData[11] = 0;
		vertexData[12] = left;
		vertexData[13] = top;
		vertexData[14] = 0;
		vertexData[15] = left;
		vertexData[16] = bottom;
		vertexData[17] = 0;

		this.gl = gl;
		this.program = program;
		this.vertexBuffer = vertexBuffer;
		this.vertexData = vertexData;
	}

	private get positionLocation(): number {
		if (this._positionLocation == null) {
			const { gl, program } = this;
			this._positionLocation = gl.getAttribLocation(program, 'position');
		}
		return this._positionLocation;
	}

	private calculateCameraMatrix() {
		const { x, y } = this.rotation();
		rotateXY(this.cameraMatrix, x * TAU, y * TAU);
		vec3.set(this.cameraOrigin, 0, 0, baseCameraDistance * this.zoom());
		vec3.transformMat3(this.cameraOrigin, this.cameraOrigin, this.cameraMatrix);
		const target = this.origin();
		vec3.add(this.cameraOrigin, this.cameraOrigin, [target.x, target.y, target.z]);
		this.cameraDirty = false;
	}

	private setViewport(left: number, bottom: number, width: number, height: number) {
		const { gl, program } = this;
		const uViewport = gl.getUniformLocation(program, 'viewport');
		gl.uniform4fv(uViewport, [left, bottom, width, height]);
		gl.viewport(left, bottom, width, height);
	}

	private setSimpleUniforms() {
		const { gl, program } = this;
		const uT = gl.getUniformLocation(program, 't');
		const uRenderType = gl.getUniformLocation(program, 'render_type');

		gl.uniform1f(uT, this.time());
		gl.uniform1i(uRenderType, this.renderType());
	}

	private drawSingleView() {
		const { gl, program } = this;
		const uCameraMatrix = gl.getUniformLocation(program, 'camera_matrix');
		const uCameraOrigin = gl.getUniformLocation(program, 'camera_origin');
		if (this.cameraDirty) {
			this.calculateCameraMatrix();
		}
		gl.uniform3fv(uCameraOrigin, this.cameraOrigin);
		gl.uniformMatrix3fv(uCameraMatrix, false, this.cameraMatrix);
		const resolution = this.resolution();
		this.setViewport(0, 0, resolution.width, resolution.height);
		gl.drawArrays(gl.TRIANGLES, 0, 6);
	}

	private drawQuadView() {
		const { gl, program } = this;
		const uCameraMatrix = gl.getUniformLocation(program, 'camera_matrix');
		const uCameraOrigin = gl.getUniformLocation(program, 'camera_origin');

		const splitPoint = this.quadSplitPoint();
		const resolution = this.resolution();
		const minPanelSize = 64;
		const freePaneSize = [
			clamp(
				Math.round(splitPoint.x * resolution.width),
				minPanelSize,
				resolution.width - minPanelSize
			),
			clamp(
				Math.round(splitPoint.y * resolution.height),
				minPanelSize,
				resolution.height - minPanelSize
			)
		];

		const leftPaneWidth = freePaneSize[0];
		const topPaneHeight = freePaneSize[1];
		const rightPaneWidth = resolution.width - freePaneSize[0];
		const bottomPaneHeight = resolution.height - freePaneSize[1];

		const zoom = this.zoom();
		const target = this.origin();
		// bottom left: XY
		gl.uniform3fv(uCameraOrigin, [target.x, target.y, target.z + baseCameraDistance * zoom]);
		gl.uniformMatrix3fv(uCameraMatrix, false, this.orthogonalXY);
		this.setViewport(0, 0, leftPaneWidth, bottomPaneHeight);
		gl.drawArrays(gl.TRIANGLES, 0, 6);

		// bottom right: ZY
		gl.uniform3fv(uCameraOrigin, [target.x - baseCameraDistance * zoom, target.y, target.z]);
		gl.uniformMatrix3fv(uCameraMatrix, false, this.orthogonalZY);
		this.setViewport(leftPaneWidth, 0, rightPaneWidth, bottomPaneHeight);
		gl.drawArrays(gl.TRIANGLES, 0, 6);

		// top left: free camera
		if (this.cameraDirty) {
			this.calculateCameraMatrix();
		}
		gl.uniform3fv(uCameraOrigin, this.cameraOrigin);
		gl.uniformMatrix3fv(uCameraMatrix, false, this.cameraMatrix);
		this.setViewport(0, bottomPaneHeight, leftPaneWidth, topPaneHeight);
		gl.drawArrays(gl.TRIANGLES, 0, 6);

		// top right: top-down
		gl.uniform3fv(uCameraOrigin, [target.x, target.y + baseCameraDistance * zoom, target.z]);
		gl.uniformMatrix3fv(uCameraMatrix, false, this.orthogonalXZ);
		this.setViewport(leftPaneWidth, bottomPaneHeight, rightPaneWidth, topPaneHeight);
		gl.drawArrays(gl.TRIANGLES, 0, 6);
	}

	updateCamera() {
		this.cameraDirty = true;
	}

	draw() {
		if (!this.currentFragmentShader) {
			return;
		}
		this.setSimpleUniforms();
		const { gl, vertexBuffer, vertexData, positionLocation } = this;
		gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, vertexData, gl.STATIC_DRAW);
		gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0);
		gl.enableVertexAttribArray(positionLocation);
		if (this.quadView()) {
			this.drawQuadView();
		} else {
			this.drawSingleView();
		}
	}

	recompileShader(fragmentShaderSource: string) {
		const { gl, program, currentFragmentShader, currentFragmentShaderSource } = this;

		if (fragmentShaderSource === currentFragmentShaderSource) {
			console.info('skipping shader compilation');
			return;
		}

		if (currentFragmentShader) {
			gl.detachShader(program, currentFragmentShader);
			gl.deleteShader(currentFragmentShader);
		}
		try {
			const startTime = performance.now();
			const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
			gl.attachShader(program, fragmentShader);
			gl.linkProgram(program);
			this._positionLocation = null;
			if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
				const info = gl.getProgramInfoLog(program);
				throw new Error('failed to link shader program', { cause: info });
			}
			gl.useProgram(program);
			this.currentFragmentShader = fragmentShader;
			this.currentFragmentShaderSource = fragmentShaderSource;
			const endTime = performance.now();
			console.log(`spent ${endTime - startTime}ms compiling shader`);
		} catch (e) {
			this.currentFragmentShader = null;
			throw e;
		}
	}
}
