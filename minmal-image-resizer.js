(function() {
    const file_input = document.getElementById("files")
    const width_input = document.getElementById("width")
    const height_input = document.getElementById("height")
    const mode_input = document.getElementById("mode")

    const output_container = document.getElementById("output-image-container")

    const update_previews = event => {
        output_container.innerHTML = ""
        const input_files = get_input_files()
        const width = get_current_width()
        const height = get_current_height()
        const canvas_aspect = width / height

        for (const file_obj of input_files) {
            const editing_canvas = document.createElement("canvas");
            
            output_container.appendChild(editing_canvas)

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
                        const m = get_current_mode()
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

    const get_input_files = () => {
        return file_input.files
    }

    const get_current_width = function() {
        return (width_input.value || 905)
    }

    const get_current_height = function() {
        return (height_input.value || 500)
    }

    const get_current_mode = function() {
        return mode_input.value
    }

    file_input.addEventListener("input", update_previews)
    width_input.addEventListener("input", update_previews)
    height_input.addEventListener("input", update_previews)
    mode_input.addEventListener("input", update_previews)
})()