window.shaders = window.shaders || {}
window.shaders.quad_vs = `attribute vec4 position;

/**
 * Taken from twgl docs
 * Use with
 * ```
 * position = [
 *     -1, -1, 0,
 *      1, -1, 0,
 *     -1,  1, 0,
 *     -1,  1, 0,
 *      1, -1, 0,
 *      1,  1, 0
 * ]
 * ````
 */
void main() {
    gl_Position = position;
}
`