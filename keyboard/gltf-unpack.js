// Source hand assets use compact tuples on top of glTF 2.0, not a binary codec.
const NODE_FIELDS = ['name', 'children', 'translation', 'rotation', 'scale', 'mesh', 'skin'];
const ACCESSOR_FIELDS = ['bufferView', 'componentType', 'count', 'type', 'max', 'min'];
const ANIMATION_FIELDS = ['name', 'channels', 'samplers'];
const BUFFER_FIELDS = ['buffer', 'byteLength', 'byteOffset', 'target'];
const PATHS = { 1: 'translation', 2: 'rotation', 3: 'scale' };
const INTERPOLATION = { 1: 'LINEAR', 2: 'SCALAR' };
const TYPES = { 1: 'VEC3', 2: 'VEC4' };

function unpack(tuple, fields, transforms = {}) {
  const result = {};
  fields.forEach((field, index) => {
    const value = tuple[index];
    if (value != null) result[field] = transforms[field] ? transforms[field](value) : value;
  });
  return result;
}

// One `|` opens a new tuple and one `~` is a null hole. Expanding both in a single
// scan avoids building a second ~1.1 MB intermediate string on the load path.
const TOKENS = { '|': '],[', '~': 'null' };

export function unpackHandGltf(text) {
  const gltf = JSON.parse(text.replace(/[|~]/g, (token) => TOKENS[token]));
  gltf.nodes = gltf.nodes.map(tuple => unpack(tuple, NODE_FIELDS));
  gltf.accessors = gltf.accessors.map(tuple => unpack(tuple, ACCESSOR_FIELDS, {
    type: value => TYPES[value] ?? value,
  }));
  gltf.animations = gltf.animations.map(tuple => unpack(tuple, ANIMATION_FIELDS, {
    channels: values => values.map(([sampler, node, path]) => ({ sampler, target: { node, path: PATHS[path] ?? path } })),
    samplers: values => values.map(([input, output, interpolation]) => ({ input, output, interpolation: INTERPOLATION[interpolation] ?? interpolation })),
  }));
  gltf.bufferViews = gltf.bufferViews.map(tuple => unpack(tuple, BUFFER_FIELDS));
  return gltf;
}
