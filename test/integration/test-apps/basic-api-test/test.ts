import { electronTestRunner} from '../../runner';

electronTestRunner(__dirname, async(ctx) => {
	await ctx
		.expect(
			{payload: 9}
		)
		.run();
});
