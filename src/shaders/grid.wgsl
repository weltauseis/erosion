struct Vertex {
    @location(0) pos: vec3f,
    @location(1) uv: vec2f,
}

struct VertexOut {
    @builtin(position) pos: vec4f,
    @location(0) uv: vec2f,
}

@group(0) @binding(0)
var <uniform> view: mat4x4<f32>;

@group(0) @binding(1)
var <uniform> proj: mat4x4<f32>;

@group(0) @binding(2)
var viz_sampler: sampler;

@group(1) @binding(0)
var terrain_height_texture: texture_2d<f32>;

@group(1) @binding(1)
var water_height_texture: texture_2d<f32>;


@vertex
fn vertexMain(in: Vertex) -> VertexOut {
    var out: VertexOut;

    out.pos = proj * view * vec4f(in.pos, 1.0);
    out.uv = in.uv;

    return out;
}

@fragment
fn fragmentMain(in: VertexOut) -> @location(0) vec4f {
    //return vec4f(in.uv, 0.0, 1.0);
    let height = textureSample(terrain_height_texture, viz_sampler, in.uv).r;
    let water = textureSample(water_height_texture, viz_sampler, in.uv).r;

    const water_color = vec3f(0.0, 0.0, 1.0);
    let height_color = vec3f(height, height, height);
    return vec4f(mix(height_color, water_color, water), 1.0);
    //return vec4f(1.0, 1.0, 1.0, 1.0);

    //return textureSample(t1, viz_sampler, in.uv);
} 