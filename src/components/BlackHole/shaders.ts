export const vertexShader = `
  varying vec2 vUv;

  void main() {
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    vUv = uv;
  }
`;

export const fragmentShader = `
  varying vec2 vUv;
  uniform sampler2D uSpaceTexture;
  uniform vec2 uResolution;
  uniform float uTime;
  uniform int uMaxIterations;

  #define STEP_SIZE 0.1
  #define PI 3.1415926535897932384626433832795
  #define TAU 6.283185307179586476925286766559

  vec3 camPos = vec3(0, 1, -7);
  vec3 blackholePos = vec3(0, 0, 0);
  float innerDiskRadius = 2.0;
  float outerDiskRadius = 5.0;
  float diskTwist = 10.0;
  float flowRate = 0.6;

  // Noise functions for disk texture
  float hash(float n) {
    return fract(sin(n) * 753.5453123);
  }

  float noise(vec3 x) {
    vec3 p = floor(x);
    vec3 f = fract(x);
    f = f * f * (3.0 - 2.0 * f);
    float n = p.x + p.y * 157.0 + 113.0 * p.z;

    return mix(mix(mix(hash(n + 0.0), hash(n + 1.0), f.x),
        mix(hash(n + 157.0), hash(n + 158.0), f.x), f.y),
        mix(mix(hash(n + 113.0), hash(n + 114.0), f.x),
        mix(hash(n + 270.0), hash(n + 271.0), f.x), f.y), f.z);
  }

  float fbm(vec3 pos, const int numOctaves, const float iterScale, const float detail, const float weight) {
    float mul = weight;
    float add = 1.0 - 0.5 * mul;
    float t = noise(pos) * mul + add;

    for (int i = 1; i < numOctaves; ++i) {
      pos *= iterScale;
      mul = exp2(log2(weight) - float(i) / detail);
      add = 1.0 - 0.5 * mul;
      t *= noise(pos) * mul + add;
    }

    return t;
  }

  vec4 raytrace(vec3 rayDir, vec3 rayPos) {
    vec4 color = vec4(0, 0, 0, 1);
    float h2 = pow(length(cross(rayPos, rayDir)), 2.0);

    for (int i = 0; i < uMaxIterations; i++) {
      float dist = length(rayPos - blackholePos);

      // Event horizon check
      if (dist < 1.0) {
        return vec4(0, 0, 0, 1);
      }

      // Schwarzschild metric
      rayDir += -1.5 * h2 * rayPos / pow(pow(dist, 2.0), 2.5) * STEP_SIZE;

      vec3 steppedRayPos = rayPos + rayDir * STEP_SIZE;

      // Varying depth for accretion disk
      float depth = pow(STEP_SIZE, 3.0) + fbm(rayPos, 5, 10.0, 1.8, 10.5) * 0.05;

      // Accretion disk check
      if (dist > innerDiskRadius && dist < outerDiskRadius && rayPos.y * steppedRayPos.y < depth) {
        // Disk UV calculation
        float deltaDiskRadius = outerDiskRadius - innerDiskRadius;
        float diskDist = dist - innerDiskRadius;

        vec3 uvw = vec3(
          (atan(steppedRayPos.z, abs(steppedRayPos.x)) / TAU) - (diskTwist / sqrt(dist)),
          pow(diskDist / deltaDiskRadius, 2.0) + ((flowRate / TAU) / deltaDiskRadius),
          steppedRayPos.y * 0.5 + 0.5
        ) / 2.0;

        // Disk density with texture
        float diskDensity = 1.0 - length(steppedRayPos / vec3(outerDiskRadius, 1.0, outerDiskRadius));
        diskDensity *= smoothstep(innerDiskRadius, innerDiskRadius + 1.0, dist);

        float densityVariation = fbm(2.0 * uvw, 5, 2.0, 1.0, 1.0);
        diskDensity *= inversesqrt(dist) * densityVariation;

        float opticalDepth = STEP_SIZE * 50.0 * diskDensity;

        // Doppler shift
        vec3 shiftVector = 0.6 * cross(normalize(steppedRayPos), vec3(0.0, 1.0, 0.0));
        float velocity = dot(rayDir, shiftVector);
        float dopplerShift = sqrt((1.0 - velocity) / (1.0 + velocity));

        // Gravitational shift
        float gravitationalShift = sqrt((1.0 - 2.0 / dist) / (1.0 - 2.0 / length(camPos)));

        return vec4(vec3(1) * dopplerShift * gravitationalShift * opticalDepth, 1.0);
      }

      rayPos = steppedRayPos;
    }

    // Sample background texture
    // Convert ray direction to spherical coordinates for texture sampling
    float theta = atan(rayDir.z, rayDir.x);
    float phi = asin(rayDir.y);
    vec2 texCoord = vec2(
      theta / TAU + 0.5,
      phi / PI + 0.5
    );

    color = texture2D(uSpaceTexture, texCoord);

    return color;
  }

  void main() {
    vec2 uv = (vUv - 0.5) * 2.0 * vec2(uResolution.x / uResolution.y, 1);

    vec3 rayDir = normalize(vec3(uv, 1));
    vec3 rayPos = camPos;

    gl_FragColor = raytrace(rayDir, rayPos);
  }
`;
