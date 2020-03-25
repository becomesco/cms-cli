<script>
  import TemplateCard from '../components/template-card.svelte';

  export let props;
  console.log(props);
  const templateStore = props.find(e => e.name === 'templateStore').value;

  let templates;

  templateStore.subscribe(value => {
    templates = value;
  });
</script>

<style>
  .page {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(250px, 370px));
    grid-gap: 20px;
  }
</style>

<div class="page">
  {#each templates as template}
    <TemplateCard {template} />
  {/each}
</div>
