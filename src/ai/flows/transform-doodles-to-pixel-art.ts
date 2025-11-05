'use server';

/**
 * @fileOverview Transforms user doodles into stylized pixel art using an AI tool.
 *   The doodle transformation leverages the googleai/gemini-pro-vision model for image-to-image processing.
 *
 * - transformDoodleToPixelArt - A function that handles the transformation of a doodle to pixel art.
 * - TransformDoodleToPixelArtInput - The input type for the transformDoodleToPixelArt function.
 * - TransformDoodleToPixelArtOutput - The return type for the transformDoodleToPixelArt function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const TransformDoodleToPixelArtInputSchema = z.object({
  doodleDataUri: z
    .string()
    .describe(
      "A doodle as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type TransformDoodleToPixelArtInput = z.infer<
  typeof TransformDoodleToPixelArtInputSchema
>;

const TransformDoodleToPixelArtOutputSchema = z.object({
  pixelArtDataUri: z
    .string()
    .describe(
      'The stylized pixel art as a data URI that must include a MIME type and use Base64 encoding. Expected format: data:<mimetype>;base64,<encoded_data>.'
    ),
});
export type TransformDoodleToPixelArtOutput = z.infer<
  typeof TransformDoodleToPixelArtOutputSchema
>;

export async function transformDoodleToPixelArt(
  input: TransformDoodleToPixelArtInput
): Promise<TransformDoodleToPixelArtOutput> {
  return transformDoodleToPixelArtFlow(input);
}

const transformDoodleToPixelArtFlow = ai.defineFlow(
  {
    name: 'transformDoodleToPixelArtFlow',
    inputSchema: TransformDoodleToPixelArtInputSchema,
    outputSchema: TransformDoodleToPixelArtOutputSchema,
  },
  async input => {
    const {media} = await ai.generate({
      model: 'googleai/gemini-pro-vision',
      prompt: [
        {media: {url: input.doodleDataUri}},
        {text: 'Transform this doodle into stylized pixel art.'},
      ],
      config: {
        responseModalities: ['TEXT', 'IMAGE'], // MUST provide both TEXT and IMAGE, IMAGE only won't work
      },
    });

    if (!media) {
      throw new Error('No pixel art was generated.');
    }

    return {pixelArtDataUri: media.url};
  }
);
