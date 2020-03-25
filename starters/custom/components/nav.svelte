<script>
  import { Link } from 'svelte-routing';

  export let rootPath;

  const options = [
    {
      name: 'Page 1',
      path: '',
    },
    {
      name: 'Page 2',
      path: '/page-2',
    },
  ];
</script>

<div class="custom-nav">
  {#each options as option}
    <div class="option">
      <Link to="{rootPath}{option.path}">{option.name}</Link>
    </div>
  {/each}
</div>
