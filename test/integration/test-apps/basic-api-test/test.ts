import { electronTestRunner} from '../../runner';

electronTestRunner(__dirname, async (ctx) => {
  await ctx
    .expect({
		testData: {payload: 9}
    })
    .run();
});
