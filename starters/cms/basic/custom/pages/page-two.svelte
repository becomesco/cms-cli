<script>
  export let props;

  const pageTwoTitle = props.find(e => e.name === 'pageTwoTitle').value;
</script>

<h1>{pageTwoTitle}</h1>
