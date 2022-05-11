window.shaders = window.shaders || {}
/**
 * Create a shader with the given horizontal and vertical radii as well as the
 * peak of the transferred kernel dialled in. Naturally, the values should match
 * the kernel passed as a uniform.
 */
window.shaders.gaussian_fs = (
    horizontal_kernel_radius,
    vertical_kernel_radius,
    kernel_peak
) =>
`precision mediump float;

uniform vec2 resolution;
uniform sampler2D kernel;
uniform sampler2D image;

varying vec2 v_tex_coord;

vec2 pixel_step = 1. / resolution;
vec2 kernel_pixel_step = vec2(
    ${1 / (2 * horizontal_kernel_radius + 1)},
    ${1 / (2 * vertical_kernel_radius + 1)}
);

void main() {
    vec3 color = vec3(0.);
    for (int y = ${-vertical_kernel_radius}; y <= ${vertical_kernel_radius}; ++y) {
        for (int x = ${-horizontal_kernel_radius}; x <= ${horizontal_kernel_radius}; ++x) {
            color += texture2D(image, v_tex_coord + vec2(x, y) * pixel_step).rgb
                * texture2D(
                    kernel,
                    vec2(x + ${horizontal_kernel_radius}, y + ${vertical_kernel_radius}) * kernel_pixel_step
                ).a * ${kernel_peak};
            // DEBUGGING FRAGMENT: compute the integral at this pixel
            // color += vec3(texture2D(
            //     kernel,
            //     vec2(x + ${horizontal_kernel_radius}, y + ${vertical_kernel_radius}) * kernel_pixel_step
            // ).a * ${kernel_peak});
        }
    }
    gl_FragColor = vec4(color, 1);
    // DEBUGGING FRAGMENT: show the kernel
    // gl_FragColor = vec4(vec3(texture2D(kernel, v_tex_coord).a), 1.);
}
`