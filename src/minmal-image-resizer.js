function gaussian_kernel(sigma) {
    const half_width = Math.ceil(3 * sigma)
    const factor = 1 / Math.sqrt(2 * Math.PI * sigma * sigma)
    const exp_divisor = 2 * sigma * sigma

    const kernel = new Array(half_width * 2 + 1)
    for (let i = -half_width; i <= half_width; ++i) {
        kernel[i + half_width] = factor * Math.pow(Math.E, -((i * i) / exp_divisor))
    }

    return kernel
}

function gaussian_kernel_2d(sigma) {
    if (!Array.isArray(sigma)) {
        sigma = [sigma, sigma];
    }
    const radius = [Math.ceil(3 * sigma[0]), Math.ceil(3 * sigma[1])]
    const width = radius[0] * 2 + 1
    const height = radius[1] * 2 + 1

    const factor = 1 / (2 * Math.PI * sigma[0] * sigma[1])
    const exp_divisor = 2 * sigma[0] * sigma[1]

    const kernel = new Array(width * height)
    for (let y = -radius[1]; y <= radius[1]; ++y) {
        for (let x = -radius[0]; x <= radius[0]; ++x) {
            kernel[
                (y + radius[1]) * width +
                x + radius[0]
            ] = factor * Math.pow(Math.E, -((x * x + y * y) / exp_divisor))
        }
    }

    const peak = kernel[radius[1] * width + radius[0]]

    return {
        kernel,
        width,
        height,
        peak
    }
}

/**
 * Applies a gaussian filter with standard deviation `sigma` to `image` and
 * returns the result on a canvas
 * 
 * @param {HTMLImageElement} image
 * @param {Number | [Number, Number]} sigma
 */
function gaussian(image, sigma) {
    // Kernel computation ------------------------------------------------------
    if (!Array.isArray(sigma)) {
        sigma = [sigma, sigma];
    }

    const kernel = gaussian_kernel_2d(sigma);

    // Canvas setup ------------------------------------------------------------
    // TODO: keep a canvas on hand and initialise ahead of time
    const gl_canvas = document.createElement("canvas")
    gl_canvas.setAttribute("width", image.width)
    gl_canvas.setAttribute("height", image.height)
    gl_canvas.width = image.width;
    gl_canvas.height = image.height;
    const gl = gl_canvas.getContext("webgl");

    // WebGL setup -------------------------------------------------------------
    const program_info = twgl.createProgramInfo(gl,[
        "quad_vs",
        shaders.gaussian_fs(
            Math.floor(kernel.width / 2),
            Math.floor(kernel.height / 2),
            kernel.peak
        )
    ]);

    const arrays = {
        a_position: [-1, -1, 0, 1, -1, 0, -1, 1, 0, -1, 1, 0, 1, -1, 0, 1, 1, 0],
        a_tex_coord: [
            0.0,  0.0,
            1.0,  0.0,
            0.0,  1.0,
            0.0,  1.0,
            1.0,  0.0,
            1.0,  1.0,
        ]
    };
    const buffer_info = twgl.createBufferInfoFromArrays(gl, arrays);
    const textures = twgl.createTextures(gl, {
        kernel: {
            mag: gl.LINEAR,
            min: gl.LINEAR,
            format: gl.ALPHA,
            width: kernel.width,
            height: kernel.height,
            // scale peak to 1 and convert to 8 bit representation for transfer
            // without the normalisation the loss of precision leads to an
            // integral <<< 1, i.e. darkened images
            src: kernel.kernel.map(s => Math.round(s / kernel.peak * 255))
        },
        image: {
            mag: gl.LINEAR,
            min: gl.LINEAR,
            src: image
        }
    })
    
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    
    const uniforms = {
        resolution: [gl.canvas.width, gl.canvas.height],
        kernel: textures.kernel,
        image: textures.image
    };

    gl.useProgram(program_info.program);
    twgl.setBuffersAndAttributes(gl, program_info, buffer_info);
    twgl.setUniforms(program_info, uniforms);
    twgl.drawBufferInfo(gl, buffer_info);

    // We're done, return the canvas  ------------------------------------------
    return gl_canvas
}

/**
 * Apply a low-pass filter to `image` so it can be smootly downsized to
 * `target_size`.
 * 
 * @param {HTMLImageElement} image
 * @param {[Number, Number]} target_size width and height
 * @return {Canvas} a canvas of the same size as `image` containing the filtered
 * pixels
 */
function lpf_image_for_downsampling(image, target_size, filter_factor) {
    const width_scale = target_size[0] / image.width
    const height_scale = target_size[1] / image.height

    return gaussian(image, [
        1 / (filter_factor * width_scale),
        1 / (filter_factor * height_scale)
    ])
}

class MinimalImageResizer {
    constructor() {
        this.file_input = document.getElementById("files")
        this.width_input = document.getElementById("width")
        this.height_input = document.getElementById("height")
        this.mode_input = document.getElementById("mode")
        this.lpf_factor_input = document.getElementById("lpf-factor")
        this.format_input = document.getElementById("format")
        this.quality_input = document.getElementById("quality")

        this.output_container = document.getElementById("output-image-container")

        this.file_input.addEventListener("input", this.update_previews.bind(this))
        this.width_input.addEventListener("input", this.update_previews.bind(this))
        this.height_input.addEventListener("input", this.update_previews.bind(this))
        this.mode_input.addEventListener("input", this.update_previews.bind(this))
        this.lpf_factor_input.addEventListener("input", this.update_previews.bind(this))
        this.format_input.addEventListener("input", this.update_previews.bind(this))
        this.quality_input.addEventListener("input", this.update_previews.bind(this))

        this.update_previews()
    }

    get_input_files() {
        return this.file_input.files
    }

    get_current_width() {
        return (this.width_input.value || 905)
    }

    get_current_height() {
        return (this.height_input.value || 500)
    }

    get_current_mode() {
        return this.mode_input.value
    }

    get_current_lpf_factor() {
        const f = parseFloat(this.lpf_factor_input.value)
        return f >= 0 ? f : 4
    }

    get_current_format() {
        const f = this.format_input.value
        return ["image/jpeg", "image/png"].includes(f) ? f : "image/jpeg"
    }

    get_current_quality() {
        const q = this.quality_input.value
        return q > 0 && q <= 1 ? q : 0.8
    }

    get_current_previews() {
        return this.output_container.querySelectorAll("canvas")
    }

    update_previews() {
        const input_files = this.get_input_files()
        if (input_files.length === 0) {
            this.output_container.innerHTML = "<p>Select images to resize to see preview of output</p>"
            return;
        }
        this.output_container.innerHTML = ""
        const width = this.get_current_width()
        const height = this.get_current_height()
        const canvas_aspect = width / height

        for (const file_obj of input_files) {
            const editing_canvas = document.createElement("canvas");
            editing_canvas.dataset.filename = file_obj.name
            
            this.output_container.appendChild(editing_canvas)

            const editing_ctx = editing_canvas.getContext("2d")

            const reader = new FileReader();
            reader.onload = () => {
                const img = new Image();
                img.onload = () => {
                    editing_canvas.setAttribute("width", width)
                    editing_canvas.setAttribute("height", height)
                    editing_canvas.width = width;
                    editing_canvas.height = height;

                    const image_aspect = img.width / img.height

                    const image_pos = (() => {
                        const m = this.get_current_mode()
                        let pos;
                        switch (m) {
                            case "cover":
                                if (image_aspect > canvas_aspect) {
                                    pos = {
                                        width: height * image_aspect,
                                        height: height
                                    }
                                } else {
                                    pos = {
                                        width: width,
                                        height: width / image_aspect
                                    }
                                }

                                pos.top = Math.abs(height - pos.height) / -2
                                pos.left = Math.abs(width - pos.width) / -2

                                return pos
                            case "contain":
                                if (image_aspect > canvas_aspect) {
                                    pos = {
                                        width: width,
                                        height: width / image_aspect
                                    }
                                } else {
                                    pos = {
                                        width: height * image_aspect,
                                        height: height
                                    }
                                }

                                pos.top = Math.abs(height - pos.height) / 2
                                pos.left = Math.abs(width - pos.width) / 2

                                return pos
                            case "exact":
                                return {
                                    width,
                                    height,
                                    top: 0,
                                    left: 0,
                                } 
                            default:
                                throw Error("Invalid mode: " + m)
                        }
                    })()

                    const lpf_factor = this.get_current_lpf_factor()

                    let img_to_draw
                    if (lpf_factor > 0) {
                        img_to_draw = lpf_image_for_downsampling(img,
                        [image_pos.width, image_pos.height], lpf_factor)
                    } else {
                        img_to_draw = img
                    }

                    editing_ctx.drawImage(img_to_draw,
                        image_pos.left,
                        image_pos.top,
                        image_pos.width,
                        image_pos.height);
                }
                img.src = reader.result;
            };
            reader.readAsDataURL(file_obj);
        }
    }

    async save_zip() {
        const z = new JSZip();

        const previews = this.get_current_previews();
        const format = this.get_current_format()
        const quality = this.get_current_quality()

        for (const p of previews) {
            const [info, data] = p.toDataURL(
                format, quality
            ).split(",")
            const [_, __, type, ___] = info.split(/[:/;]/)
            let filename = p.dataset.filename + "." + type
            z.file(filename, data, {base64: true});
        }

        const zipfile = await z.generateAsync({type: "blob"})
        saveAs(zipfile, "resized-" + (new Date()).toISOString() + ".zip")
    }
}

const __image_resizer = new MinimalImageResizer();
