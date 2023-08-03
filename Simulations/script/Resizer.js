const setSize = (container, camera, renderer) => {
  console.log(container.width, container.height)
    camera.aspect = container.width /  container.height;
    camera.updateProjectionMatrix();
     renderer.setSize(container.width,  container.height);
    renderer.setPixelRatio(window.devicePixelRatio);
  };
   class Resizer {
    constructor(container, camera, renderer) {
      // Set initial size on load.
      setSize(container, camera, renderer);
       window.addEventListener('resize', () => {
        // Set the size again if a resize occurs.
        setSize(container, camera, renderer);
        // Perform any custom actions.
        this.onResize();
      });
    }
     onResize() {}
  }
   export { Resizer };