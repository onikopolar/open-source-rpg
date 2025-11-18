import Head from 'next/head';

export default function Home() {
  return (
    <div>
      <Head>
        <title>Home</title>
      </Head>
      <h1>Redirecionando...</h1>
    </div>
  );
}

export async function getServerSideProps() {
  return {
    redirect: {
      destination: '/dashboard',
      permanent: false,
    },
  };
}