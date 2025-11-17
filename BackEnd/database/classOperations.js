const { CreateTableCommand, DescribeTableCommand } = require('@aws-sdk/client-dynamodb');
const { ScanCommand, GetCommand, PutCommand } = require('@aws-sdk/lib-dynamodb');
const { client, docClient } = require('./dynamoClient');

const TABLE_NAME = 'classDB';

/**
 * Create classDB table
 * Table structure:
 * - Primary Key: classId (String)
 * - Attributes: className, credits, description
 */
async function createClassDB() {
  try {
    // Check if table already exists
    try {
      await client.send(new DescribeTableCommand({ TableName: TABLE_NAME }));
      console.log(`Table ${TABLE_NAME} already exists`);
      return;
    } catch (error) {
      if (error.name !== 'ResourceNotFoundException') {
        throw error;
      }
      // Table doesn't exist, proceed with creation
    }

    const params = {
      TableName: TABLE_NAME,
      AttributeDefinitions: [
        { AttributeName: 'classId', AttributeType: 'S' }
      ],
      KeySchema: [
        { AttributeName: 'classId', KeyType: 'HASH' }
      ],
      BillingMode: 'PROVISIONED',
      ProvisionedThroughput: {
        ReadCapacityUnits: 5,
        WriteCapacityUnits: 5
      }
    };

    await client.send(new CreateTableCommand(params));
    console.log(`Table ${TABLE_NAME} created successfully`);

    // Wait for table to be active
    let tableActive = false;
    while (!tableActive) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      const description = await client.send(new DescribeTableCommand({ TableName: TABLE_NAME }));
      tableActive = description.Table.TableStatus === 'ACTIVE';
    }
    console.log(`Table ${TABLE_NAME} is now active`);
  } catch (error) {
    if (error.name === 'ResourceInUseException') {
      console.log(`Table ${TABLE_NAME} already exists`);
    } else {
      console.error(`Error creating table ${TABLE_NAME}:`, error);
      throw error;
    }
  }
}

/**
 * Add dummy class data to classDB
 * Generates 5-10 classes with random course codes
 */
async function addDummyDataToClassDB() {
  try {
    // Check if table already has data
    const existingClasses = await getAllClasses();
    if (existingClasses.length > 0) {
      console.log(`Table ${TABLE_NAME} already contains ${existingClasses.length} classes`);
      return;
    }

    const coursePrefixes = ['IFT', 'CSE', 'CCE', 'EEE'];
    const courseNumbers = [101, 201, 301, 401, 501, 593, 594, 595];
    const creditOptions = [3, 4];

    // Comprehensive class catalog organized by department
    const classCatalog = {
      'IFT': [
        { name: 'Advanced Computer Networks', desc: 'Network protocols, routing algorithms, and distributed systems architecture' },
        { name: 'Cloud Computing and Virtualization', desc: 'Cloud infrastructure, containerization, and serverless computing' },
        { name: 'Cybersecurity Fundamentals', desc: 'Security principles, cryptography, and threat detection' },
        { name: 'Web Application Development', desc: 'Full-stack development with modern frameworks and APIs' },
        { name: 'Mobile App Development', desc: 'iOS and Android development with cross-platform frameworks' },
        { name: 'DevOps and CI/CD', desc: 'Continuous integration, deployment pipelines, and infrastructure as code' },
        { name: 'Network Security and Cryptography', desc: 'Advanced encryption, secure protocols, and network defense' },
        { name: 'Internet of Things', desc: 'IoT architecture, sensor networks, and edge computing' }
      ],
      'CSE': [
        { name: 'Data Structures and Algorithms', desc: 'Advanced data structures, algorithm design, and complexity analysis' },
        { name: 'Database Management Systems', desc: 'Relational databases, SQL, NoSQL, and database design' },
        { name: 'Software Engineering Principles', desc: 'Software development lifecycle, design patterns, and agile methodologies' },
        { name: 'Machine Learning', desc: 'Supervised and unsupervised learning, neural networks, and deep learning' },
        { name: 'Artificial Intelligence', desc: 'AI algorithms, knowledge representation, and intelligent agents' },
        { name: 'Computer Graphics', desc: '3D rendering, animation, and visual computing techniques' },
        { name: 'Compiler Design', desc: 'Lexical analysis, parsing, and code generation' },
        { name: 'Distributed Systems', desc: 'Distributed algorithms, consensus protocols, and fault tolerance' }
      ],
      'CCE': [
        { name: 'Digital Signal Processing', desc: 'Signal analysis, filtering, and transform techniques' },
        { name: 'Wireless Communication Systems', desc: 'RF systems, modulation techniques, and wireless protocols' },
        { name: 'Computer Architecture', desc: 'Processor design, memory hierarchy, and parallel computing' },
        { name: 'Embedded Systems Design', desc: 'Microcontrollers, real-time systems, and hardware-software integration' },
        { name: 'VLSI Design', desc: 'Integrated circuit design, CMOS technology, and chip fabrication' },
        { name: 'Optical Communication', desc: 'Fiber optics, photonics, and optical networking' },
        { name: 'Satellite Communication', desc: 'Satellite systems, orbital mechanics, and space communication' },
        { name: 'Network Protocols and Standards', desc: 'TCP/IP, routing protocols, and network architecture' }
      ],
      'EEE': [
        { name: 'Power Systems Analysis', desc: 'Power generation, transmission, and distribution systems' },
        { name: 'Control Systems Engineering', desc: 'Feedback control, stability analysis, and controller design' },
        { name: 'Digital Electronics', desc: 'Logic circuits, sequential systems, and digital design' },
        { name: 'Microprocessors and Microcontrollers', desc: 'Assembly programming, interfacing, and embedded applications' },
        { name: 'Renewable Energy Systems', desc: 'Solar, wind, and sustainable energy technologies' },
        { name: 'Electric Machines and Drives', desc: 'Motors, generators, and power electronics' },
        { name: 'Electromagnetic Theory', desc: 'Maxwell\'s equations, wave propagation, and antenna design' },
        { name: 'Power Electronics', desc: 'Converters, inverters, and motor drives' }
      ]
    };

    // Generate 10-15 diverse classes
    const numClasses = Math.floor(Math.random() * 6) + 10; // 10 to 15
    const generatedClasses = new Set();
    const usedClassNames = new Set();

    // Shuffle and select classes from each department
    const allClasses = [];
    for (const [prefix, classes] of Object.entries(classCatalog)) {
      classes.forEach(classInfo => {
        allClasses.push({ prefix, ...classInfo });
      });
    }

    // Shuffle array
    for (let i = allClasses.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [allClasses[i], allClasses[j]] = [allClasses[j], allClasses[i]];
    }

    // Select classes ensuring no duplicate names
    let classCount = 0;
    for (const classInfo of allClasses) {
      if (classCount >= numClasses) break;

      const prefix = classInfo.prefix;
      const number = courseNumbers[Math.floor(Math.random() * courseNumbers.length)];
      const classId = `${prefix} ${number}`;

      // Avoid duplicate IDs and names
      if (generatedClasses.has(classId) || usedClassNames.has(classInfo.name)) {
        continue;
      }

      generatedClasses.add(classId);
      usedClassNames.add(classInfo.name);

      const credits = creditOptions[Math.floor(Math.random() * creditOptions.length)];

      const params = {
        TableName: TABLE_NAME,
        Item: {
          classId: classId,
          className: classInfo.name,
          credits: credits,
          description: classInfo.desc
        }
      };

      await docClient.send(new PutCommand(params));
      console.log(`Added class: ${classId} - ${classInfo.name}`);
      classCount++;
    }

    console.log(`Successfully added ${numClasses} dummy classes to ${TABLE_NAME}`);
  } catch (error) {
    console.error('Error adding dummy data:', error);
    throw error;
  }
}

/**
 * Get all classes from the database
 * @returns {Promise<Array>} - Array of class objects
 */
async function getAllClasses() {
  try {
    const params = {
      TableName: TABLE_NAME
    };

    const result = await docClient.send(new ScanCommand(params));
    return result.Items || [];
  } catch (error) {
    console.error('Error getting all classes:', error);
    throw error;
  }
}

/**
 * Get class by classId
 * @param {string} classId - Class ID
 * @returns {Promise<Object|null>} - Class object or null if not found
 */
async function getClassById(classId) {
  try {
    const params = {
      TableName: TABLE_NAME,
      Key: {
        classId: classId
      }
    };

    const result = await docClient.send(new GetCommand(params));
    return result.Item || null;
  } catch (error) {
    console.error('Error getting class by ID:', error);
    throw error;
  }
}

module.exports = {
  createClassDB,
  addDummyDataToClassDB,
  getAllClasses,
  getClassById
};
