<script>
  // Core CMS components
  import { Router, Route, Link } from 'svelte-routing';
  import Layout from './components/layout.svelte';
  import PageOne from './pages/page-one.svelte';
  import PageTwo from './pages/page-two.svelte';

  // Props are exported by `bcms-config.js`
  export let templateStore; // Core export
  export let pageTwoTitle; // Custom export
  export let url = '';

  const router = {
    root: '/dashboard/custom', // Do not change
    pages: [
      {
        uri: '',
        component: PageOne,
        props: [
          {
            name: 'templateStore',
            value: templateStore,
          },
        ],
      },
      {
        uri: '/page-2',
        component: PageTwo,
        props: [
          {
            name: 'pageTwoTitle',
            value: pageTwoTitle,
          },
        ],
      },
    ],
  };
</script>

<style lang="scss" global>
  @import './styles/global.scss';
</style>

<Router {url}>
  <Layout rootPath={router.root}>
    {#each router.pages as page}
      <Route
        path="{router.root}{page.uri}"
        component={page.component}
        props={page.props} />
    {/each}
  </Layout>
</Router>
