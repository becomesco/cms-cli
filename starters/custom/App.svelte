<script>
  // Core CMS components
  import { CodeSnippet } from '@becomes/cms/frontend/components';

  // Props are exported by `bcms-config.js`
  export let templateStore; // Core export
  export let myCustomProp; // Custom export

  let templates;

  templateStore.subscribe(value => {
    templates = value;
  });
</script>

<style lang="scss">
  .wrapper {
    padding: 20px;
  }
</style>

<div class="wrapper">
  <h1>This is your custom component.</h1>
  <h2>My Custom prop: {myCustomProp}</h2>
  <h3>Templates</h3>
  <CodeSnippet code={JSON.stringify(templates, null, '  ')} />
</div>
