export interface SampleImage {
  id: string;
  title: string;
  src: string;
}

export const SAMPLE_IMAGES: SampleImage[] = [
  {
    id: "tree",
    title: "반짝이는 트리",
    src: "/samples/sample-tree.png",
  },
  {
    id: "snowman",
    title: "겨울 눈사람",
    src: "/samples/sample-snowman.png",
  },
  {
    id: "cozy",
    title: "따뜻한 벽난로",
    src: "/samples/sample-fireplace.png",
  },
  {
    id: "santa",
    title: "산타의 밤하늘",
    src: "/samples/sample-santa.png",
  },
];
