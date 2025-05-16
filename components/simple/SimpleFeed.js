import SimplePost from './SimplePost';

export default function SimpleFeed() {
  const posts = [
    {
      id: 1,
      username: 'nike',
      image: 'https://images.unsplash.com/photo-1552346154-21d32810aba3?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
      caption: 'New collection just dropped. #JustDoIt',
      likes: 34521
    },
    {
      id: 2,
      username: 'travel_photography',
      image: 'https://images.unsplash.com/photo-1502791451862-7bd8c1df43a7?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
      caption: 'Sunset in paradise 🌅 #travel #adventure',
      likes: 15784
    }
  ];
  
  return (
    <div className="max-w-md mx-auto p-4">
      {posts.map(post => (
        <SimplePost 
          key={post.id}
          username={post.username}
          image={post.image}
          caption={post.caption}
          likes={post.likes}
        />
      ))}
    </div>
  );
} 