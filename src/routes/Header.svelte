<header>
	<a class="title" href="/">Bauble</a><span class="spacer" /><a class="text-link" href="/help"
		>Help</a
	><a class="text-link" href="/about">About</a><a
		class="image-link"
		href="https://github.com/ianthehenry/bauble"
		rel="noreferrer"
		target="_blank"><svg><use xlink:href="/icons.svg#github" /></svg></a
	>
</header>

<style>
	header {
		--text-color: #1d1f21;
		color: var(--text-color);
		background-color: #ffc6f9;
		background-image: linear-gradient(to right, #ffc6f9, #fec4b2);
		height: var(--header-height);
		line-height: var(--header-height);
		display: flex;
	}

	.title,
	.spacer {
		flex: 1;
	}

	a {
		text-decoration: none;
	}
	a.text-link {
		padding: 0 var(--header-padding);
	}

	a,
	a:visited,
	a:active {
		color: var(--text-color);
	}

	svg {
		fill: var(--text-color);
		width: 24px;
		height: 24px;
	}

	header > :first-child {
		padding-left: var(--header-padding);
	}

	header > :last-child {
		padding-right: var(--header-padding);
	}

	.image-link {
		display: flex;
		width: var(--header-height);
		height: var(--header-height);
		justify-content: center;
		align-items: center;
	}
</style>
