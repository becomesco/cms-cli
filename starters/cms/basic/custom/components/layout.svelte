<script>
  import Nav from './nav.svelte';
  export let rootPath;
</script>

<div class="custom-layout">
  <slot />
  <Nav {rootPath} />
</div>
