import "./style.css";
import { GridMesh } from "./mesh";
import { InitWebGPU } from "./webgpu";
import { mat4, vec3 } from "gl-matrix";

import gridShaderString from "./shaders/grid.wgsl?raw";
import { OrbitCamera } from "./camera";
import { Perlin } from "./noise";
import { ErosionCompute } from "./compute";
import { setup_controls } from "./ui";

let viewport = document.querySelector("#viewport") as HTMLElement;
let canvas = document.querySelector("canvas");
canvas!.width = viewport.clientWidth;
canvas!.height = viewport.clientHeight;

const { device, context, canvasFormat, depthTexture } = await InitWebGPU();

const camera = new OrbitCamera(device);
const grid_mesh = new GridMesh(
    device,
    1024,
    camera.view_matrix_buffer,
    camera.proj_matrix_buffer
);

const compute = new ErosionCompute(device);
setup_controls(compute);

let orbiting = false;
document.addEventListener("keydown", (e) => {
    if (e.key === "k") {
        orbiting = !orbiting;
    }
});

const render_pipeline_layout = device.createPipelineLayout({
    bindGroupLayouts: [
        grid_mesh.bind_group_layout,
        compute.view_bind_group_layout,
        compute.params_bind_group_layout,
    ],
});

const render_pipeline = device.createRenderPipeline({
    label: "Mesh Render Pipeline",
    layout: render_pipeline_layout,
    vertex: {
        module: grid_mesh.shader_module,
        entryPoint: "vertexMain",
        buffers: [grid_mesh.vertex_buffer_layout],
    },
    fragment: {
        module: grid_mesh.shader_module,
        entryPoint: "fragmentMain",
        targets: [
            {
                format: canvasFormat,
            },
        ],
    },
    primitive: {
        frontFace: "ccw",
        cullMode: "back",
    },
    depthStencil: {
        depthWriteEnabled: true,
        depthCompare: "less",
        format: "depth24plus",
    },
});

function render() {
    const encoder = device.createCommandEncoder();

    if (compute.running) compute.encode_full_step(encoder);
    if (orbiting) camera.rotate_camera(0.1, 0);

    const pass = encoder.beginRenderPass({
        colorAttachments: [
            {
                view: context.getCurrentTexture().createView(),
                loadOp: "clear",
                storeOp: "store",
                clearValue: [0, 0, 0, 1.0],
            },
        ],
        depthStencilAttachment: {
            view: depthTexture.createView(),
            depthClearValue: 1.0,
            depthLoadOp: "clear",
            depthStoreOp: "store",
        },
    });

    pass.setPipeline(render_pipeline);
    pass.setVertexBuffer(0, grid_mesh.vertex_buffer);
    pass.setIndexBuffer(grid_mesh.index_buffer, "uint32");
    pass.setBindGroup(0, grid_mesh.bind_group);
    pass.setBindGroup(1, compute.view_bind_group);
    pass.setBindGroup(2, compute.params_bind_group);
    pass.drawIndexed(grid_mesh.nb_to_draw);
    pass.end();

    const commandBuffer = encoder.finish();

    device.queue.submit([commandBuffer]);

    requestAnimationFrame(render);
}

requestAnimationFrame(render);
