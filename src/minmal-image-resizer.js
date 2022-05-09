class MinimalImageResizer {
    constructor() {
        this.file_input = document.getElementById("files")
        this.width_input = document.getElementById("width")
        this.height_input = document.getElementById("height")
        this.mode_input = document.getElementById("mode")

        this.output_container = document.getElementById("output-image-container")

        this.file_input.addEventListener("input", this.update_previews.bind(this))
        this.width_input.addEventListener("input", this.update_previews.bind(this))
        this.height_input.addEventListener("input", this.update_previews.bind(this))
        this.mode_input.addEventListener("input", this.update_previews.bind(this))

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

                    editing_ctx.drawImage(img,
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

        for (const p of previews) {
            const [info, data] = p.toDataURL().split(",")
            const [_, __, type, ___] = info.split(/[:/;]/)
            let filename = p.dataset.filename + "." + type
            z.file(filename, data, {base64: true});
        }

        const zipfile = await z.generateAsync({type: "blob"})
        saveAs(zipfile, "resized-" + (new Date()).toISOString() + ".zip")
    }
}

const __image_resizer = new MinimalImageResizer();

// (function() {
//     const file_input = document.getElementById("files")
//     const width_input = document.getElementById("width")
//     const height_input = document.getElementById("height")
//     const mode_input = document.getElementById("mode")

//     const output_container = document.getElementById("output-image-container")

//     const update_previews = event => {
//         output_container.innerHTML = ""
//         const input_files = get_input_files()
//         const width = get_current_width()
//         const height = get_current_height()
//         const canvas_aspect = width / height

//         for (const file_obj of input_files) {
//             const editing_canvas = document.createElement("canvas");
            
//             output_container.appendChild(editing_canvas)

//             const editing_ctx = editing_canvas.getContext("2d")

//             const reader = new FileReader();
//             reader.onload = () => {
//                 const img = new Image();
//                 img.onload = () => {
//                     editing_canvas.setAttribute("width", width)
//                     editing_canvas.setAttribute("height", height)
//                     editing_canvas.width = width;
//                     editing_canvas.height = height;

//                     const image_aspect = img.width / img.height

//                     const image_pos = (() => {
//                         const m = get_current_mode()
//                         let pos;
//                         switch (m) {
//                             case "cover":
//                                 if (image_aspect > canvas_aspect) {
//                                     pos = {
//                                         width: height * image_aspect,
//                                         height: height
//                                     }
//                                 } else {
//                                     pos = {
//                                         width: width,
//                                         height: width / image_aspect
//                                     }
//                                 }

//                                 pos.top = Math.abs(height - pos.height) / -2
//                                 pos.left = Math.abs(width - pos.width) / -2

//                                 return pos
//                             case "contain":
//                                 if (image_aspect > canvas_aspect) {
//                                     pos = {
//                                         width: width,
//                                         height: width / image_aspect
//                                     }
//                                 } else {
//                                     pos = {
//                                         width: height * image_aspect,
//                                         height: height
//                                     }
//                                 }

//                                 pos.top = Math.abs(height - pos.height) / 2
//                                 pos.left = Math.abs(width - pos.width) / 2

//                                 return pos
//                             case "exact":
//                                 return {
//                                     width,
//                                     height,
//                                     top: 0,
//                                     left: 0,
//                                 } 
//                             default:
//                                 throw Error("Invalid mode: " + m)
//                         }
//                     })()

//                     editing_ctx.drawImage(img,
//                         image_pos.left,
//                         image_pos.top,
//                         image_pos.width,
//                         image_pos.height);
//                 }
//                 img.src = reader.result;
//             };
//             reader.readAsDataURL(file_obj);
//         }
//     }

//     const get_input_files = () => {
//         return file_input.files
//     }

//     const get_current_width = function() {
//         return (width_input.value || 905)
//     }

//     const get_current_height = function() {
//         return (height_input.value || 500)
//     }

//     const get_current_mode = function() {
//         return mode_input.value
//     }

//     file_input.addEventListener("input", update_previews)
//     width_input.addEventListener("input", update_previews)
//     height_input.addEventListener("input", update_previews)
//     mode_input.addEventListener("input", update_previews)
// })()