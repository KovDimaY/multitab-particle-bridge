import { EffectComposer, Bloom } from "@react-three/postprocessing";

type GlowingEffectProps = {
  intensity?: number;
  luminanceThreshold?: number;
  luminanceSmoothing?: number;
};

const GlowingEffect = ({ intensity = 1, luminanceThreshold = 0, luminanceSmoothing = 3 }: GlowingEffectProps) => (
  <>
    <color attach="background" args={["black"]} />
    <ambientLight />

    <EffectComposer>
      <Bloom intensity={intensity} luminanceThreshold={luminanceThreshold} luminanceSmoothing={luminanceSmoothing} />
    </EffectComposer>
  </>
);

export default GlowingEffect;
