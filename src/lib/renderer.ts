import { mat3, vec3 } from 'gl-matrix';
import { clamp, TAU } from './util';

const baseCameraDistance = 512;

function assert<T>(value: T, message?: string): NonNullable<T> {
	if (value === null || value === undefined)
		throw new Error(message ?? `Assertion failed: ${value} value`);
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

export function createRenderer(
	canvas: HTMLCanvasElement,
	time: () => number, // TODO: give this a unique type
	renderType: () => number, // TODO: give this a type
	rotation: () => { x: number; y: number },
	origin: () => { x: number; y: number; z: number },
	zoom: () => number, // TODO: give this a unique type
	quadView: () => boolean,
	quadSplitPoint: () => { x: number; y: number },
	resolution: () => { width: number; height: number }
) {
	let currentFragmentShader: WebGLShader | null = null;
	let currentFragmentShaderSource: string | null = null;
	let _positionLocation: number | null = null;

	let cameraDirty = true;
	const cameraMatrix: mat3 = mat3.create();
	const cameraOrigin: vec3 = vec3.create();

	// TODO: the perspective is actually calculated
	// in the shader, not here, so this is actually a
	// "perspective XY" view
	const orthogonalXY: mat3 = mat3.create();
	const orthogonalXZ: mat3 = mat3.create();
	const orthogonalZY: mat3 = mat3.create();

	rotateXY(orthogonalXY, 0, 0);
	rotateXY(orthogonalZY, -0.5 * Math.PI, 0);
	rotateXY(orthogonalXZ, 0, -0.5 * Math.PI);

	const gl = assert(
		canvas.getContext('webgl2', { antialias: false }),
		'failed to create webgl2 context'
	);

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

	function positionLocation(): number {
		if (_positionLocation == null) {
			_positionLocation = gl.getAttribLocation(program, 'position');
		}
		return _positionLocation;
	}

	function calculateCameraMatrix() {
		const { x, y } = rotation();
		rotateXY(cameraMatrix, x * TAU, y * TAU);
		vec3.set(cameraOrigin, 0, 0, baseCameraDistance * zoom());
		vec3.transformMat3(cameraOrigin, cameraOrigin, cameraMatrix);
		const target = origin();
		vec3.add(cameraOrigin, cameraOrigin, [target.x, target.y, target.z]);
		cameraDirty = false;
	}

	function setViewport(left: number, bottom: number, width: number, height: number) {
		const uViewport = gl.getUniformLocation(program, 'viewport');
		gl.uniform4fv(uViewport, [left, bottom, width, height]);
		gl.viewport(left, bottom, width, height);
	}

	function setSimpleUniforms() {
		const uT = gl.getUniformLocation(program, 't');
		const uRenderType = gl.getUniformLocation(program, 'render_type');

		gl.uniform1f(uT, time());
		gl.uniform1i(uRenderType, renderType());
	}

	function drawSingleView() {
		const uCameraMatrix = gl.getUniformLocation(program, 'camera_matrix');
		const uCameraOrigin = gl.getUniformLocation(program, 'camera_origin');
		if (cameraDirty) {
			calculateCameraMatrix();
		}
		gl.uniform3fv(uCameraOrigin, cameraOrigin);
		gl.uniformMatrix3fv(uCameraMatrix, false, cameraMatrix);
		const res = resolution();
		setViewport(0, 0, res.width, res.height);
		gl.drawArrays(gl.TRIANGLES, 0, 6);
	}

	function drawQuadView() {
		const uCameraMatrix = gl.getUniformLocation(program, 'camera_matrix');
		const uCameraOrigin = gl.getUniformLocation(program, 'camera_origin');

		const splitPoint = quadSplitPoint();
		const res = resolution();
		const minPanelSize = 64;
		const freePaneSize = [
			clamp(Math.round(splitPoint.x * res.width), minPanelSize, res.width - minPanelSize),
			clamp(Math.round(splitPoint.y * res.height), minPanelSize, res.height - minPanelSize)
		];

		const leftPaneWidth = freePaneSize[0];
		const topPaneHeight = freePaneSize[1];
		const rightPaneWidth = res.width - freePaneSize[0];
		const bottomPaneHeight = res.height - freePaneSize[1];

		const zoom_ = zoom();
		const target = origin();
		// bottom left: XY
		gl.uniform3fv(uCameraOrigin, [target.x, target.y, target.z + baseCameraDistance * zoom_]);
		gl.uniformMatrix3fv(uCameraMatrix, false, orthogonalXY);
		setViewport(0, 0, leftPaneWidth, bottomPaneHeight);
		gl.drawArrays(gl.TRIANGLES, 0, 6);

		// bottom right: ZY
		gl.uniform3fv(uCameraOrigin, [target.x - baseCameraDistance * zoom_, target.y, target.z]);
		gl.uniformMatrix3fv(uCameraMatrix, false, orthogonalZY);
		setViewport(leftPaneWidth, 0, rightPaneWidth, bottomPaneHeight);
		gl.drawArrays(gl.TRIANGLES, 0, 6);

		// top left: free camera
		if (cameraDirty) {
			calculateCameraMatrix();
		}
		gl.uniform3fv(uCameraOrigin, cameraOrigin);
		gl.uniformMatrix3fv(uCameraMatrix, false, cameraMatrix);
		setViewport(0, bottomPaneHeight, leftPaneWidth, topPaneHeight);
		gl.drawArrays(gl.TRIANGLES, 0, 6);

		// top right: top-down
		gl.uniform3fv(uCameraOrigin, [target.x, target.y + baseCameraDistance * zoom_, target.z]);
		gl.uniformMatrix3fv(uCameraMatrix, false, orthogonalXZ);
		setViewport(leftPaneWidth, bottomPaneHeight, rightPaneWidth, topPaneHeight);
		gl.drawArrays(gl.TRIANGLES, 0, 6);
	}

	return {
		updateCamera() {
			cameraDirty = true;
		},

		draw() {
			if (!currentFragmentShader) {
				return;
			}
			setSimpleUniforms();
			gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
			gl.bufferData(gl.ARRAY_BUFFER, vertexData, gl.STATIC_DRAW);
			gl.vertexAttribPointer(positionLocation(), 3, gl.FLOAT, false, 0, 0);
			gl.enableVertexAttribArray(positionLocation());
			if (quadView()) {
				drawQuadView();
			} else {
				drawSingleView();
			}
		},

		recompileShader(fragmentShaderSource: string) {
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
				_positionLocation = null;
				if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
					const info = gl.getProgramInfoLog(program);
					throw new Error('failed to link shader program', { cause: info });
				}
				gl.useProgram(program);
				currentFragmentShader = fragmentShader;
				currentFragmentShaderSource = fragmentShaderSource;
				const endTime = performance.now();
				console.log(`spent ${endTime - startTime}ms compiling shader`);
			} catch (e) {
				currentFragmentShader = null;
				throw e;
			}
		}
	};
}
