@group(0) @binding(0)
var bds_read: texture_storage_2d<rgba32float, read>;

@group(0) @binding(1)
var bds_write: texture_storage_2d<rgba32float, write>;

@group(1) @binding(0)
var<uniform> timestep: f32;

@group(1) @binding(1)
var<uniform> rainfall: f32;

@compute @workgroup_size(16, 16) fn ComputeMain(@builtin(global_invocation_id) id: vec3<u32>) {
    let bds = textureLoad(bds_read, id.xy);
    // FIXME : this breaks everything
    // actually it's because it creates negative water height
    // but i'm keeping the fixme to remind myself that i need to deal with negative water height
    //let rain = abs((cos(f32(id.x)) + cos(f32(id.y)))) * rainfall; 
    
    let bds_new = bds + vec4f(0, rainfall * timestep, 0, 0);
    textureStore(bds_write, id.xy, bds_new);
}