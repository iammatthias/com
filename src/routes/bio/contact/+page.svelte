<script lang="ts">
	import { fade } from 'svelte/transition';
	import { socials } from '$lib/store/socials';

	interface SubmissionResult {
		success: boolean;
		message: string;
	}

	let name = '';
	let email = '';
	let message = '';
	let isSubmitting = false;
	let submissionResult: SubmissionResult | null = null;

	async function handleSubmit() {
		isSubmitting = true;

		try {
			await new Promise((resolve) => setTimeout(resolve, 1000));
			submissionResult = {
				success: true,
				message: 'Your message has been sent successfully!'
			};
			// Reset form
			name = '';
			email = '';
			message = '';
		} catch (error) {
			submissionResult = {
				success: false,
				message: 'There was an error sending your message. Please try again.'
			};
		} finally {
			isSubmitting = false;
		}
	}

	// Group platforms by activity level
	const activePlatforms = $socials.filter(
		(social) =>
			!social.blurb.includes('inactive') &&
			!social.blurb.includes('maintain an account') &&
			!social.blurb.includes('Not as active')
	);

	const lesserPlatforms = $socials.filter(
		(social) =>
			social.blurb.includes('inactive') ||
			social.blurb.includes('maintain an account') ||
			social.blurb.includes('Not as active')
	);
</script>

<div class="page" in:fade>
	<section class="breadcrumbs">
		<a href="/">Home</a>
		<span>/</span>
		<a href="/bio">Bio</a>
		<span>/</span>
		<span>Contact</span>
	</section>

	<section class="header">
		<h1>Contact</h1>
		<p>Feel free to get in touch with me using the form below:</p>
	</section>

	<section class="content">
		{#if submissionResult}
			<div
				class="alert"
				class:success={submissionResult.success}
				class:error={!submissionResult.success}
			>
				{submissionResult.message}
			</div>
		{/if}

		<form on:submit|preventDefault={handleSubmit}>
			<div class="form-group">
				<label for="name">Name</label>
				<input type="text" id="name" bind:value={name} required disabled={isSubmitting} />
			</div>

			<div class="form-group">
				<label for="email">Email</label>
				<input type="email" id="email" bind:value={email} required disabled={isSubmitting} />
			</div>

			<div class="form-group">
				<label for="message">Message</label>
				<textarea id="message" bind:value={message} rows="5" required disabled={isSubmitting}
				></textarea>
			</div>

			<button type="submit" disabled={isSubmitting}>
				{#if isSubmitting}
					Sending...
				{:else}
					Send Message
				{/if}
			</button>
		</form>

		<div class="social-platforms">
			<h2>Connect with me</h2>
			<p>You can also reach me through any of these platforms:</p>

			<div class="platforms-section">
				<h3>Active Platforms</h3>
				<div class="platforms-grid">
					{#each activePlatforms as platform}
						<a href={platform.url} class="platform-card" target="_blank" rel="noopener noreferrer">
							<div class="platform-name">{platform.name}</div>
							<div class="platform-username">{platform.username}</div>
							<div class="platform-description">{platform.blurb}</div>
						</a>
					{/each}
				</div>
			</div>

			{#if lesserPlatforms.length > 0}
				<div class="platforms-section">
					<h3>Other Platforms</h3>
					<div class="platforms-grid">
						{#each lesserPlatforms as platform}
							<a
								href={platform.url}
								class="platform-card"
								target="_blank"
								rel="noopener noreferrer"
							>
								<div class="platform-name">{platform.name}</div>
								<div class="platform-username">{platform.username}</div>
								<div class="platform-description">{platform.blurb}</div>
							</a>
						{/each}
					</div>
				</div>
			{/if}
		</div>
	</section>
</div>

<style>
	.page {
		max-width: var(--content-width);
		margin: 0 auto;
		padding: var(--space-8) var(--space-4);
	}

	.breadcrumbs {
		margin-bottom: var(--space-8);
		color: var(--color-text-secondary);
	}

	.breadcrumbs a {
		color: var(--color-text-secondary);
		text-decoration: none;
	}

	.breadcrumbs a:hover {
		color: var(--color-text);
	}

	.breadcrumbs span {
		margin: 0 var(--space-2);
	}

	.header {
		margin-bottom: var(--space-8);
	}

	.content {
		margin-top: var(--space-8);
	}

	form {
		margin-bottom: var(--space-12);
	}

	.form-group {
		margin-bottom: var(--space-4);
	}

	label {
		display: block;
		margin-bottom: var(--space-2);
		font-weight: 500;
	}

	input,
	textarea {
		width: 100%;
		padding: var(--space-3);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		font-family: var(--font-sans);
		background-color: var(--color-bg);
		color: var(--color-text);
	}

	button {
		padding: var(--space-3) var(--space-6);
		background-color: var(--color-primary);
		color: white;
		border: none;
		border-radius: var(--radius-md);
		font-weight: 500;
		cursor: pointer;
		transition: background-color 0.2s;
	}

	button:hover:not(:disabled) {
		background-color: var(--color-primary-dark);
	}

	button:disabled {
		opacity: 0.7;
		cursor: not-allowed;
	}

	.alert {
		padding: var(--space-4);
		border-radius: var(--radius-md);
		margin-bottom: var(--space-6);
	}

	.success {
		background-color: var(--color-success-bg);
		color: var(--color-success-text);
		border: 1px solid var(--color-success-border);
	}

	.error {
		background-color: var(--color-error-bg);
		color: var(--color-error-text);
		border: 1px solid var(--color-error-border);
	}

	.social-platforms {
		padding-top: var(--space-8);
		border-top: 1px solid var(--color-border);
	}

	.platforms-section {
		margin-top: var(--space-8);
	}

	.platforms-section h3 {
		margin-bottom: var(--space-4);
	}

	.platforms-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
		gap: var(--space-4);
	}

	.platform-card {
		display: block;
		padding: var(--space-4);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		text-decoration: none;
		color: var(--color-text);
		transition: all 0.2s;
	}

	.platform-card:hover {
		border-color: var(--color-primary);
		transform: translateY(-2px);
	}

	.platform-name {
		font-weight: 600;
		margin-bottom: var(--space-2);
	}

	.platform-username {
		color: var(--color-text-secondary);
		margin-bottom: var(--space-2);
	}

	.platform-description {
		font-size: 0.9em;
		color: var(--color-text-secondary);
	}
</style>
