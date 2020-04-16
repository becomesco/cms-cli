<script>
  export let template;
</script>

<style>
  .template-card {
    background-color: var(--c-white);
    box-shadow: 0 2px 4px 0 rgba(0, 0, 0, 0.1);
    padding: 20px;
  }

  .name {
    font-size: 12pt;
    font-weight: bold;
  }

  .desc {
    font-size: 10pt;
    color: var(--c-gray);
  }
</style>

<div class="template-card">
  <div class="name">{template.name}</div>
  <div class="desc">
    {template.desc ? template.desc : 'Template does not have a description.'}
  </div>
</div>
