<script lang="ts">
	import { hello } from '@alexaegis/common';
	import svelteLogo from './assets/svelte.svg';
	import Counter from './lib/Counter.svelte';

	hello('svelte');
</script>

<main>
	<div>
		<a href="https://svelte.dev" target="_blank" rel="noreferrer">
			<img src={svelteLogo} class="logo svelte" alt="Svelte Logo" />
		</a>
	</div>
	<h1>Svelte</h1>

	<div class="card">
		<Counter />
	</div>
</main>

<style>
	main {
		display: grid;
		justify-content: center;
		justify-items: center;
	}
</style>
